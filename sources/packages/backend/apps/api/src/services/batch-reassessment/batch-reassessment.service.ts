import { Injectable } from "@nestjs/common";
import {
  Application,
  ApplicationStatus,
  BatchReassessment,
  BatchReassessmentApplication,
  BatchReassessmentApplicationResult,
  BatchReassessmentStatus,
  RecordDataModelService,
  User,
} from "@sims/sims-db";
import { DataSource } from "typeorm";
import { BatchReassessmentSummary } from "./batch-reassessment.service.models";
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
   * Checks whether a batch manual reassessment is currently in progress.
   * @returns `true` if a batch manual reassessment is in progress, otherwise `false`.
   */
  async isBatchInProgress(): Promise<boolean> {
    return await this.repo.exists({
      where: { status: BatchReassessmentStatus.InProgress },
    });
  }

  /**
   * Updates the processing status of a batch manual reassessment.
   * @param batchReassessmentId batch manual reassessment id.
   * @param status new batch manual reassessment status.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @returns the updated batch manual reassessment.
   */
  async updateBatchReassessment(
    batchReassessmentId: number,
    status: BatchReassessmentStatus,
    auditUserId: number,
  ): Promise<void> {
    const auditUser = { id: auditUserId } as User;
    await this.dataSource
      .getRepository(BatchReassessment)
      .update(
        { id: batchReassessmentId },
        { status, modifier: auditUser, updatedAt: new Date() },
      );
  }

  /**
   * Gets persisted batch manual reassessment submissions and their application results.
   * @returns batch manual reassessment submissions.
   */
  async getBatchReassessmentSummary(): Promise<BatchReassessmentSummary[]> {
    return this.repo
      .createQueryBuilder("batchReassessment")
      .select([
        "batchReassessment.id AS id",
        'batchReassessment.batchNumber AS "batchNumber"',
        "batchReassessment.status AS status",
        'batchReassessment.createdAt AS "createdAt"',
        'creator.firstName AS "creatorFirstName"',
        'creator.lastName AS "creatorLastName"',
      ])
      .addSelect(
        "COUNT(CASE WHEN batchReassessmentApplication.result = 'Success' THEN 1 END)",
        "successCount",
      )
      .addSelect(
        "COUNT(CASE WHEN batchReassessmentApplication.result = 'Failure' THEN 1 END)",
        "failureCount",
      )
      .leftJoin(
        "batchReassessment.batchReassessmentApplications",
        "batchReassessmentApplication",
      )
      .leftJoin("batchReassessment.creator", "creator")
      .groupBy("batchReassessment.id")
      .addGroupBy("batchReassessment.status")
      .addGroupBy("batchReassessment.createdAt")
      .addGroupBy("creator.firstName")
      .addGroupBy("creator.lastName")
      .orderBy("batchReassessment.createdAt", "DESC")
      .getRawMany<BatchReassessmentSummary>();
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
  ): Promise<void> {
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
      const creator = { id: userId } as User;
      // Create a new batch reassessment to indicate that the batch is in progress.
      const batchReassessment = new BatchReassessment();
      batchReassessment.batchNumber = newBatchUniqueSequence;
      batchReassessment.status = BatchReassessmentStatus.InProgress;
      batchReassessment.creator = creator;
      batchReassessment.createdAt = new Date();
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

        try {
          // Fail early if the application id doesn't exist.
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
          batchReassessmentApplication.result =
            BatchReassessmentApplicationResult.Success;
        } catch (error) {
          batchReassessmentApplication.failureReason =
            error?.message ?? "Unknown error";
          batchReassessmentApplication.result =
            BatchReassessmentApplicationResult.Failure;
        }
        await entityManager
          .getRepository(BatchReassessmentApplication)
          .save(batchReassessmentApplication);
      }
      // Update the batch reassessment status when processing is complete.
      await entityManager.getRepository(BatchReassessment).update(
        { id: savedBatchReassessment.id },
        {
          status: BatchReassessmentStatus.Completed,
          modifier: { id: userId } as User,
          updatedAt: new Date(),
        },
      );
    }); // End of transaction
  }
}
