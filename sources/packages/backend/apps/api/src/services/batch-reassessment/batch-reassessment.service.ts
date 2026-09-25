import { Injectable } from "@nestjs/common";
import {
  Application,
  ApplicationStatus,
  BatchReassessment,
  BatchReassessmentApplication,
  RecordDataModelService,
  StudentAssessmentStatus,
  User,
} from "@sims/sims-db";
import { DataSource } from "typeorm";
import {
  BatchReassessmentStatus,
  BatchReassessmentSummary,
} from "./batch-reassessment.service.models";
import { SequenceControlService } from "@sims/services";
import { APPLICATION_NOT_FOUND } from "@sims/services/constants";
import { CustomNamedError } from "@sims/utilities";
import { StudentAssessmentService } from "../student-assessment/student-assessment.service";

const BATCH_REASSESSMENT_NUMBER_SEQUENCE_NAME = "BATCH_REASSESSMENT_NUMBER";

/**
 * Provides batch manual reassessment retrieval operations.
 */
@Injectable()
export class BatchReassessmentService extends RecordDataModelService<BatchReassessment> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly sequenceService: SequenceControlService,
    private readonly studentAssessmentService: StudentAssessmentService,
  ) {
    super(dataSource.getRepository(BatchReassessment));
  }

  /**
   * Gets persisted batch manual reassessment submissions and their application results.
   * @returns batch manual reassessment submissions.
   */
  async getBatchReassessmentSummary(): Promise<BatchReassessmentSummary[]> {
    const rows = await this.repo
      .createQueryBuilder("batchReassessment")
      .select([
        'batchReassessment.id AS "id"',
        'batchReassessment.batchNumber AS "batchNumber"',
        'batchReassessment.createdAt AS "createdAt"',
        'creator.firstName AS "creatorFirstName"',
        'creator.lastName AS "creatorLastName"',
      ])
      .addSelect(
        `COUNT("batchReassessmentApplication"."id")::int`,
        "totalCount",
      )
      .addSelect(
        `COUNT(CASE WHEN "studentAssessment"."student_assessment_status" = :completedStatus THEN 1 END)::int`,
        "successCount",
      )
      .addSelect(
        `COUNT(CASE WHEN "batchReassessmentApplication"."student_assessment_id" IS NULL THEN 1 END)::int`,
        "failureCount",
      )
      .leftJoin(
        "batchReassessment.batchReassessmentApplications",
        "batchReassessmentApplication",
      )
      .leftJoin(
        "batchReassessmentApplication.studentAssessment",
        "studentAssessment",
      )
      .leftJoin("batchReassessment.creator", "creator")
      .setParameter("completedStatus", StudentAssessmentStatus.Completed)
      .groupBy("batchReassessment.id")
      .addGroupBy("creator.id")
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
   */
  async createBatchReassessment(
    applicationNumbers: string[],
    note: string,
    userId: number,
  ): Promise<BatchReassessment> {
    // Only process unique application numbers.
    const uniqueApplicationNumbers = [...new Set(applicationNumbers)];
    const applications = await this.dataSource
      .getRepository(Application)
      .createQueryBuilder("application")
      .select(["application.id", "application.applicationNumber"])
      .where("application.applicationNumber IN (:...applicationNumbers)", {
        applicationNumbers: uniqueApplicationNumbers,
      })
      .andWhere("application.applicationStatus != :editedStatus", {
        editedStatus: ApplicationStatus.Edited,
      })
      .getMany();
    const applicationIdsByNumber = new Map(
      applications.map((application) => [
        application.applicationNumber,
        application.id,
      ]),
    );

    return this.dataSource.transaction(async (entityManager) => {
      let newBatchUniqueSequence: number;
      // Consumes the next sequence number and prevents concurrent access.
      // TODO Run all code in the process callback to ensure transactional integrity.
      await this.sequenceService.consumeNextSequenceWithExistingEntityManager(
        BATCH_REASSESSMENT_NUMBER_SEQUENCE_NAME,
        entityManager,
        async (nextSequenceNumber: number) => {
          newBatchUniqueSequence = nextSequenceNumber;
        },
      );
      const now = new Date();
      const creator = { id: userId } as User;
      // Create a new batch reassessment to indicate that the batch is in progress.
      const batchReassessment = new BatchReassessment();
      batchReassessment.batchNumber = newBatchUniqueSequence;
      batchReassessment.creator = creator;
      batchReassessment.createdAt = now;
      batchReassessment.updatedAt = now;
      const savedBatchReassessment = await entityManager
        .getRepository(BatchReassessment)
        .save(batchReassessment);

      for (const applicationNumber of uniqueApplicationNumbers) {
        const applicationId = applicationIdsByNumber.get(applicationNumber);
        const batchReassessmentApplication = new BatchReassessmentApplication();
        // Always persist the applicationNumber for convenience, even though it can be determined
        // from the assessment for successful applications.
        batchReassessmentApplication.applicationNumber = applicationNumber;
        batchReassessmentApplication.batchReassessment = savedBatchReassessment;
        batchReassessmentApplication.creator = creator;
        batchReassessmentApplication.createdAt = now;
        batchReassessmentApplication.updatedAt = now;

        try {
          // Fail early if the application id doesn't exist as createManualReassessment doesn't handle undefined gracefully.
          if (!applicationId) {
            throw new CustomNamedError(
              "Application not found",
              APPLICATION_NOT_FOUND,
            );
          }
          // TODO We need the ability to pass in the current entityManager.
          const studentAssessment =
            await this.studentAssessmentService.createManualReassessment(
              applicationId,
              note,
              userId,
            );
          batchReassessmentApplication.studentAssessment = studentAssessment;
        } catch (error) {
          batchReassessmentApplication.failureReason =
            error?.message ?? "Unknown error";
        }
        await entityManager
          .getRepository(BatchReassessmentApplication)
          .save(batchReassessmentApplication);
      }
      return savedBatchReassessment;
    }); // End of transaction
  }
}
