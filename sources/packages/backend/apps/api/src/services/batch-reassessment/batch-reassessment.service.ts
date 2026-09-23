import { Injectable } from "@nestjs/common";
import {
  BatchReassessment,
  BatchReassessmentApplication,
  BatchReassessmentStatus,
  RecordDataModelService,
  User,
} from "@sims/sims-db";
import { DataSource } from "typeorm";
import { BatchReassessmentSummary } from "./batch-reassessment.service.models";

/**
 * Provides batch manual reassessment retrieval operations.
 */
@Injectable()
export class BatchReassessmentService extends RecordDataModelService<BatchReassessment> {
  constructor(private readonly dataSource: DataSource) {
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
   * Creates a new batch manual reassessment with the status set to 'InProgress'.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @returns the newly created batch manual reassessment.
   */
  async createBatchReassessment(
    auditUserId: number,
  ): Promise<BatchReassessment> {
    const auditUser = { id: auditUserId } as User;
    const batchReassessment = this.repo.create({
      status: BatchReassessmentStatus.InProgress,
      creator: auditUser,
      createdAt: new Date(),
    });
    return this.repo.save(batchReassessment);
  }

  /**
   * Creates a result record for an application included in a batch manual reassessment.
   * @param batchReassessmentApplication application result to persist.
   * @returns the persisted application result.
   */
  async createBatchReassessmentApplication(
    batchReassessmentApplication: BatchReassessmentApplication,
  ): Promise<BatchReassessmentApplication> {
    return this.dataSource
      .getRepository(BatchReassessmentApplication)
      .save(batchReassessmentApplication);
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
        "COUNT(CASE WHEN batchReassessmentApplication.result = 'Failed' THEN 1 END)",
        "failedCount",
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
      .orderBy("batchReassessment.createdAt", "ASC")
      .getRawMany<BatchReassessmentSummary>();
  }
}
