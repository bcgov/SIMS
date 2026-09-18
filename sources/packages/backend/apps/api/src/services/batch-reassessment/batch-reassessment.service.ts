import { Injectable } from "@nestjs/common";
import { BatchReassessment } from "@sims/sims-db";
import { DataSource } from "typeorm";

/**
 * Provides batch manual reassessment retrieval operations.
 */
@Injectable()
export class BatchReassessmentService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Gets persisted batch manual reassessment submissions and their application results.
   * @returns batch manual reassessment submissions.
   */
  async getBatchReassessment(): Promise<BatchReassessment[]> {
    return this.dataSource
      .getRepository(BatchReassessment)
      .createQueryBuilder("batchReassessment")
      .select([
        "batchReassessment.id",
        "batchReassessment.status",
        "batchReassessment.createdAt",
        "creator.firstName",
        "creator.lastName",
        "batchReassessmentApplication.result",
        "application.applicationNumber",
      ])
      .innerJoin(
        "batchReassessment.batchReassessmentApplications",
        "batchReassessmentApplication",
      )
      .innerJoin("batchReassessmentApplication.application", "application")
      .innerJoin("batchReassessment.creator", "creator")
      .orderBy("batchReassessment.createdAt", "DESC")
      .getMany();
  }
}
