import { Injectable } from "@nestjs/common";
import {
  Application,
  BatchReassessment,
  BatchReassessmentApplication,
  StudentAssessmentStatus,
  User,
} from "@sims/sims-db";
import { ApplicationService } from "../application/application.service";
import { DataSource, Repository } from "typeorm";
import {
  BatchReassessmentStatus,
  BatchReassessmentSummary,
} from "./batch-reassessment.service.models";
import { CustomNamedError } from "@sims/utilities";
import {
  NoteSharedService,
  SequenceControlService,
  StudentNote,
} from "@sims/services";
import { StudentAssessmentService } from "../student-assessment/student-assessment.service";
import { InjectRepository } from "@nestjs/typeorm";

const BATCH_REASSESSMENT_NUMBER_SEQUENCE_NAME = "BATCH_REASSESSMENT_NUMBER";
const BATCH_REASSESSMENT_CHUNK_SIZE = 1000;

/**
 * Provides batch manual reassessment operations.
 */
@Injectable()
export class BatchReassessmentService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(BatchReassessment)
    private readonly batchReassessmentRepo: Repository<BatchReassessment>,
    private readonly applicationService: ApplicationService,
    private readonly sequenceService: SequenceControlService,
    private readonly studentAssessmentService: StudentAssessmentService,
    private readonly noteSharedService: NoteSharedService,
  ) {}

  /**
   * Gets persisted batch manual reassessment submissions and their summary counts.
   * @returns batch manual reassessment submissions.
   */
  async getBatchReassessmentSummaries(): Promise<BatchReassessmentSummary[]> {
    const rows = await this.batchReassessmentRepo
      .createQueryBuilder("batchReassessment")
      .select("batchReassessment.id", "id")
      .addSelect("batchReassessment.batchNumber", "batchNumber")
      .addSelect("batchReassessment.createdAt", "createdAt")
      .addSelect("creator.firstName", "creatorFirstName")
      .addSelect("creator.lastName", "creatorLastName")
      .addSelect('counts."totalCount"', "totalCount")
      .addSelect('counts."successCount"', "successCount")
      .addSelect('counts."failureCount"', "failureCount")
      // Application counts aggregated per batch.
      .innerJoin(
        (subQuery) =>
          subQuery
            .select("batchApplication.batchReassessment.id", "batchId")
            .addSelect("COUNT(*)::int", "totalCount")
            .addSelect(
              "COUNT(*) FILTER (WHERE studentAssessment.studentAssessmentStatus IN (:...successStatuses))::int",
              "successCount",
            )
            .addSelect(
              "COUNT(*) FILTER (WHERE studentAssessment.id IS NULL)::int",
              "failureCount",
            )
            .from(BatchReassessmentApplication, "batchApplication")
            .leftJoin("batchApplication.studentAssessment", "studentAssessment")
            .groupBy("batchApplication.batchReassessment.id")
            .setParameter("successStatuses", [
              StudentAssessmentStatus.Completed,
              StudentAssessmentStatus.Cancelled,
            ]),
        "counts",
        'counts."batchId" = batchReassessment.id',
      )
      .leftJoin("batchReassessment.creator", "creator")
      .orderBy("batchReassessment.createdAt", "DESC")
      .getRawMany<Omit<BatchReassessmentSummary, "status">>();

    const summaries: BatchReassessmentSummary[] = rows.map((row) => ({
      ...row,
      status:
        row.totalCount === row.successCount + row.failureCount
          ? BatchReassessmentStatus.Completed
          : BatchReassessmentStatus.InProgress,
    }));

    return summaries;
  }

  /**
   * Runs a batch reassessment for a list of application numbers.
   * Each application number is processed independently so failures do not stop
   * the remaining batch items from being attempted.
   * @param applicationNumbers application numbers to be reassessed.
   * @param note note describing the reason for the batch reassessment.
   * @param userId user id who triggered the batch reassessment.
   * @returns the created batch reassessment.
   */
  async createBatchReassessment(
    applicationNumbers: string[],
    note: string,
    userId: number,
  ): Promise<BatchReassessment> {
    // Only process distinct application numbers.
    const distinctApplicationNumbers = [...new Set(applicationNumbers)];

    let savedBatchReassessment: BatchReassessment;
    return this.dataSource.transaction(async (entityManager) => {
      // Consumes the next sequence number and blocks concurrent creation of a BatchReassessment
      // while the sequence is locked. All the code in the callback will be executed within the
      // transaction and under the sequence lock.
      await this.sequenceService.consumeNextSequenceWithExistingEntityManager(
        BATCH_REASSESSMENT_NUMBER_SEQUENCE_NAME,
        entityManager,
        async (nextSequenceNumber: number) => {
          const now = new Date();
          const creator = { id: userId } as User;

          // Create a new batch reassessment.
          const batchReassessment = new BatchReassessment();
          batchReassessment.batchNumber = nextSequenceNumber;
          batchReassessment.creator = creator;
          batchReassessment.createdAt = now;
          batchReassessment.updatedAt = now;
          savedBatchReassessment = await entityManager
            .getRepository(BatchReassessment)
            .save(batchReassessment);

          const applicationNumbersToChunk = [...distinctApplicationNumbers];

          while (applicationNumbersToChunk.length > 0) {
            // Chunk the application numbers into smaller batches to process them efficiently.
            const applicationNumberChunk = applicationNumbersToChunk.splice(
              0,
              BATCH_REASSESSMENT_CHUNK_SIZE,
            );
            const applications =
              await this.applicationService.getApplicationsAssessmentStatusDetails(
                applicationNumberChunk,
                { entityManager },
              );
            const applicationsByNumber = new Map(
              applications.map((application) => [
                application.applicationNumber,
                application,
              ]),
            );
            const batchReassessmentApplicationsToSave: BatchReassessmentApplication[] =
              [];
            const applicationsToSave: Application[] = [];
            const notesToSave: StudentNote[] = [];

            for (const applicationNumber of applicationNumberChunk) {
              const batchReassessmentApplication =
                new BatchReassessmentApplication();
              // Always persist the applicationNumber for convenience, even though it can be determined
              // from the assessment for successful applications.
              batchReassessmentApplication.applicationNumber =
                applicationNumber;
              batchReassessmentApplication.batchReassessment =
                savedBatchReassessment;
              batchReassessmentApplication.creator = creator;
              batchReassessmentApplication.createdAt = now;
              batchReassessmentApplication.updatedAt = now;
              batchReassessmentApplicationsToSave.push(
                batchReassessmentApplication,
              );

              try {
                // Missing applications will trigger a validation error.
                const application = applicationsByNumber.get(applicationNumber);
                const {
                  application: applicationToBeSaved,
                  note: noteToBeSaved,
                } = this.studentAssessmentService.createBatchManualReassessment(
                  application,
                  note,
                  userId,
                );
                applicationsToSave.push(applicationToBeSaved);
                notesToSave.push(noteToBeSaved);
                // The assessment id is populated once the applications are saved.
                batchReassessmentApplication.studentAssessment =
                  applicationToBeSaved.currentAssessment;
              } catch (error: unknown) {
                if (error instanceof CustomNamedError) {
                  batchReassessmentApplication.failureReason = error.message;
                } else {
                  throw new Error(
                    `Unexpected error while processing application number ${applicationNumber}.`,
                    { cause: error },
                  );
                }
              }
            }

            // Single bulk insert for all the notes of the chunk.
            await this.noteSharedService.createStudentNotes(
              notesToSave,
              userId,
              entityManager,
            );
            // Single save for all the applications/assessments of the chunk.
            await entityManager
              .getRepository(Application)
              .save(applicationsToSave);
            // Single bulk insert for all the batch reassessment applications of the chunk.
            await entityManager
              .getRepository(BatchReassessmentApplication)
              .insert(batchReassessmentApplicationsToSave);
          }
        },
      );
      return savedBatchReassessment;
    });
  }
}
