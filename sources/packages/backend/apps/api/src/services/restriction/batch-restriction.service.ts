import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  Application,
  BatchRestriction,
  BatchRestrictionStudent,
  NoteType,
  Restriction,
  StudentRestriction,
  User,
} from "@sims/sims-db";
import {
  NoteSharedService,
  SequenceControlService,
  StudentRestrictionSharedService,
} from "@sims/services";
import { DataSource, EntityManager, Repository } from "typeorm";
import { BatchRestrictionSummary } from "./models/batch-restriction.model";

const BATCH_RESTRICTION_NUMBER_SEQUENCE_NAME = "BATCH_RESTRICTION_NUMBER";
/**
 * Number of identifiers inserted at a time. Each chunk runs a fixed number of
 * bulk inserts, keeping the number of database round trips and query parameters low.
 */
const BATCH_RESTRICTION_CHUNK_SIZE = 1000;
const APPLICATION_NUMBER_NOT_FOUND_REASON =
  "The application number does not exist.";

/**
 * Provides batch restriction operations.
 */
@Injectable()
export class BatchRestrictionService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(BatchRestriction)
    private readonly batchRestrictionRepo: Repository<BatchRestriction>,
    private readonly sequenceService: SequenceControlService,
    private readonly noteSharedService: NoteSharedService,
    private readonly studentRestrictionSharedService: StudentRestrictionSharedService,
  ) {}

  /**
   * Gets the batch restriction submissions and their summary counts, most recent first.
   * A batch student is considered successful when the student has the restriction active,
   * either added by the batch or already active, and failed when it has a failure reason.
   * @returns batch restriction submissions.
   */
  async getBatchRestrictionSummaries(): Promise<BatchRestrictionSummary[]> {
    return (
      this.batchRestrictionRepo
        .createQueryBuilder("batchRestriction")
        .select("batchRestriction.id", "id")
        .addSelect("batchRestriction.batchNumber", "batchNumber")
        .addSelect("batchRestriction.createdAt", "createdAt")
        .addSelect("creator.firstName", "creatorFirstName")
        .addSelect("creator.lastName", "creatorLastName")
        .addSelect("restriction.restrictionCode", "restrictionCode")
        .addSelect("restriction.description", "restrictionDescription")
        .addSelect('counts."totalCount"', "totalCount")
        .addSelect('counts."successCount"', "successCount")
        .addSelect('counts."failureCount"', "failureCount")
        // Student counts aggregated per batch.
        .innerJoin(
          (subQuery) =>
            subQuery
              .select("batchStudent.batchRestriction.id", "batchId")
              .addSelect("COUNT(*)::int", "totalCount")
              .addSelect(
                "COUNT(*) FILTER (WHERE batchStudent.failureReason IS NULL)::int",
                "successCount",
              )
              .addSelect(
                "COUNT(*) FILTER (WHERE batchStudent.failureReason IS NOT NULL)::int",
                "failureCount",
              )
              .from(BatchRestrictionStudent, "batchStudent")
              .groupBy("batchStudent.batchRestriction.id"),
          "counts",
          'counts."batchId" = batchRestriction.id',
        )
        .innerJoin("batchRestriction.restriction", "restriction")
        .leftJoin("batchRestriction.creator", "creator")
        .orderBy("batchRestriction.createdAt", "DESC")
        .getRawMany<BatchRestrictionSummary>()
    );
  }

  /**
   * Adds a provincial restriction to the students of the given application numbers.
   * - Duplicated application numbers are processed only once.
   * - A restriction is added only once per student, even when multiple application
   * numbers belong to the same student, and it is not added when the student
   * already has it active. Both cases are considered successful.
   * - Application numbers that do not exist are recorded as failures and do not stop
   * the remaining application numbers from being processed.
   * The batch, its students, and the student restrictions it adds share the same creation
   * date and creator, which allows the restrictions added by a batch to be identified.
   * Multiple invocations are prevented from running concurrently via the sequence
   * control mechanism, so a new batch cannot start until the previous one is persisted.
   * @param restrictionId provincial restriction to be added to the students.
   * @param applicationNumbers application numbers used to find the students.
   * @param note note added to each student restriction created by the batch.
   * @param userId user who submitted the batch.
   * @returns the created batch restriction submission.
   */
  async createBatchRestriction(
    restrictionId: number,
    applicationNumbers: string[],
    note: string,
    userId: number,
  ): Promise<BatchRestriction> {
    // Only process distinct application numbers.
    const distinctApplicationNumbers = [...new Set(applicationNumbers)];

    let savedBatchRestriction: BatchRestriction;
    return this.dataSource.transaction(async (entityManager) => {
      // Consumes the next sequence number and blocks concurrent creation of a BatchRestriction
      // while the sequence is locked. All the code in the callback will be executed within the
      // transaction and under the sequence lock.
      await this.sequenceService.consumeNextSequenceWithExistingEntityManager(
        BATCH_RESTRICTION_NUMBER_SEQUENCE_NAME,
        entityManager,
        async (nextSequenceNumber: number) => {
          const now = new Date();
          const creator = { id: userId } as User;

          // Create a new batch restriction.
          const batchRestriction = new BatchRestriction();
          batchRestriction.batchNumber = nextSequenceNumber;
          batchRestriction.restriction = {
            id: restrictionId,
          } as Restriction;
          batchRestriction.creator = creator;
          batchRestriction.createdAt = now;
          batchRestriction.updatedAt = now;
          savedBatchRestriction = await entityManager
            .getRepository(BatchRestriction)
            .save(batchRestriction);

          // The lookups are executed once for the whole batch, instead of once per chunk,
          // to scan the applications and student restrictions only once.
          const studentIdsByApplicationNumber =
            await this.getStudentIdsByApplicationNumbers(
              distinctApplicationNumbers,
              entityManager,
            );
          // Active student restriction IDs by student, either before the batch
          // or added by it, to add the restriction only once per student.
          const activeStudentRestrictionIds =
            await this.getActiveStudentRestrictionIds(
              restrictionId,
              [...new Set(studentIdsByApplicationNumber.values())],
              entityManager,
            );
          const applicationNumbersToChunk = [...distinctApplicationNumbers];

          while (applicationNumbersToChunk.length > 0) {
            // Chunk the application numbers into smaller batches to insert them efficiently.
            const applicationNumberChunk = applicationNumbersToChunk.splice(
              0,
              BATCH_RESTRICTION_CHUNK_SIZE,
            );
            const batchStudentsToSave: BatchRestrictionStudent[] = [];
            const studentIdsToAddRestriction = new Set<number>();
            for (const applicationNumber of applicationNumberChunk) {
              const batchStudent = new BatchRestrictionStudent();
              batchStudent.batchRestriction = savedBatchRestriction;
              batchStudent.applicationNumber = applicationNumber;
              batchStudent.creator = creator;
              batchStudent.createdAt = now;
              batchStudent.updatedAt = now;
              batchStudentsToSave.push(batchStudent);

              const studentId =
                studentIdsByApplicationNumber.get(applicationNumber);
              if (!studentId) {
                batchStudent.failureReason =
                  APPLICATION_NUMBER_NOT_FOUND_REASON;
                continue;
              }
              if (!activeStudentRestrictionIds.has(studentId)) {
                studentIdsToAddRestriction.add(studentId);
              }
            }

            const addedStudentRestrictionIds =
              await this.addStudentRestrictions(
                restrictionId,
                [...studentIdsToAddRestriction],
                note,
                userId,
                now,
                entityManager,
              );
            addedStudentRestrictionIds.forEach(
              (studentRestrictionId, studentId) =>
                activeStudentRestrictionIds.set(
                  studentId,
                  studentRestrictionId,
                ),
            );
            // The added student restriction IDs are only known after they are inserted,
            // hence the batch students are associated with their student restrictions afterwards.
            for (const batchStudent of batchStudentsToSave) {
              const studentId = studentIdsByApplicationNumber.get(
                batchStudent.applicationNumber,
              );
              if (studentId) {
                batchStudent.studentRestriction = {
                  id: activeStudentRestrictionIds.get(studentId),
                } as StudentRestriction;
              }
            }
            // Single bulk insert for all the batch students of the chunk.
            await entityManager
              .getRepository(BatchRestrictionStudent)
              .insert(batchStudentsToSave);
          }
        },
      );
      return savedBatchRestriction;
    });
  }

  /**
   * Gets the student of each application number.
   * All versions of an application belong to the same student.
   * The application numbers are sent as a single array parameter, which is hashed
   * by the database instead of compared one by one, and supports the maximum batch
   * size without hitting the query parameters limit.
   * @param applicationNumbers application numbers to be searched.
   * @param entityManager transactional entity manager.
   * @returns student IDs by application number. Application numbers that
   * do not exist are not included.
   */
  private async getStudentIdsByApplicationNumbers(
    applicationNumbers: string[],
    entityManager: EntityManager,
  ): Promise<Map<string, number>> {
    const applications = await entityManager
      .getRepository(Application)
      .createQueryBuilder("application")
      .select("application.applicationNumber", "applicationNumber")
      .addSelect("student.id", "studentId")
      .distinct(true)
      .innerJoin("application.student", "student")
      .where("application.applicationNumber = ANY(:applicationNumbers)", {
        applicationNumbers,
      })
      .getRawMany<{ applicationNumber: string; studentId: number }>();
    return new Map(
      applications.map((application) => [
        application.applicationNumber,
        application.studentId,
      ]),
    );
  }

  /**
   * Gets the active student restriction of the students, among the given ones,
   * that have the restriction active. When a student has the restriction active
   * more than once, the most recent student restriction is returned.
   * The student IDs are sent as a single array parameter, which is hashed by the
   * database instead of compared one by one, and supports the maximum batch size
   * without hitting the query parameters limit.
   * @param restrictionId restriction to be checked.
   * @param studentIds students to be checked.
   * @param entityManager transactional entity manager.
   * @returns active student restriction IDs by student ID. Students that
   * do not have the restriction active are not included.
   */
  private async getActiveStudentRestrictionIds(
    restrictionId: number,
    studentIds: number[],
    entityManager: EntityManager,
  ): Promise<Map<number, number>> {
    if (!studentIds.length) {
      return new Map();
    }
    const studentRestrictions = await entityManager
      .getRepository(StudentRestriction)
      .createQueryBuilder("studentRestriction")
      .select("studentRestriction.student.id", "studentId")
      .addSelect("MAX(studentRestriction.id)", "studentRestrictionId")
      .where("studentRestriction.restriction.id = :restrictionId", {
        restrictionId,
      })
      .andWhere("studentRestriction.isActive = true")
      .andWhere("studentRestriction.student.id = ANY(:studentIds)", {
        studentIds,
      })
      .groupBy("studentRestriction.student.id")
      .getRawMany<{ studentId: number; studentRestrictionId: number }>();
    return new Map(
      studentRestrictions.map((studentRestriction) => [
        studentRestriction.studentId,
        studentRestriction.studentRestrictionId,
      ]),
    );
  }

  /**
   * Adds the restriction to the students, each one with its own note,
   * and creates the restriction added notifications.
   * @param restrictionId restriction to be added.
   * @param studentIds students to receive the restriction.
   * @param note note added to each student restriction.
   * @param userId user adding the restrictions.
   * @param createdAt creation date of the batch, shared by the student restrictions.
   * @param entityManager transactional entity manager.
   * @returns added student restriction IDs by student ID.
   */
  private async addStudentRestrictions(
    restrictionId: number,
    studentIds: number[],
    note: string,
    userId: number,
    createdAt: Date,
    entityManager: EntityManager,
  ): Promise<Map<number, number>> {
    if (!studentIds.length) {
      return new Map();
    }
    // Single bulk insert for all the notes, returned in the same order as the students.
    const notes = await this.noteSharedService.createStudentNotes(
      studentIds.map((studentId) => ({
        studentId,
        noteType: NoteType.Restriction,
        description: note,
      })),
      userId,
      entityManager,
    );
    const studentRestrictions = studentIds.map((studentId, index) => {
      const studentRestriction =
        this.studentRestrictionSharedService.buildStudentRestriction(
          studentId,
          restrictionId,
          userId,
          { restrictionNoteId: notes[index].id },
        );
      studentRestriction.createdAt = createdAt;
      studentRestriction.updatedAt = createdAt;
      return studentRestriction;
    });
    // Single bulk insert for all the student restrictions, returned in the same order as the students.
    const insertResult = await entityManager
      .getRepository(StudentRestriction)
      .insert(studentRestrictions);
    const studentRestrictionIds = insertResult.identifiers.map(
      (identifier) => identifier.id as number,
    );
    await this.studentRestrictionSharedService.createNotifications(
      studentRestrictionIds,
      userId,
      entityManager,
    );
    return new Map(
      studentIds.map((studentId, index) => [
        studentId,
        studentRestrictionIds[index],
      ]),
    );
  }
}
