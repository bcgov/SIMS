import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import {
  BatchRestrictionAPIInDTO,
  BatchRestrictionSummaryAPIOutDTO,
} from "@/services/http/dto";

/**
 * Http API client for Batch Restrictions.
 */
export class BatchRestrictionApi extends HttpBaseClient {
  /**
   * Adds a restriction to the students of the given application numbers.
   * @param payload restriction, application numbers, and note for the batch.
   */
  async createBatchRestriction(
    payload: BatchRestrictionAPIInDTO,
  ): Promise<void> {
    await this.postCall(this.addClientRoot("batch-restriction"), payload);
  }

  /**
   * Gets the batch restriction submissions.
   * @returns batch restriction submissions.
   */
  getBatchRestrictions(): Promise<BatchRestrictionSummaryAPIOutDTO[]> {
    return this.getCall(this.addClientRoot("batch-restriction"));
  }
}
