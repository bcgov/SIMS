import ApiClient from "@/services/http/ApiClient";
import {
  BatchRestrictionAPIInDTO,
  BatchRestrictionSummaryAPIOutDTO,
} from "@/services/http/dto";

/**
 * Client service layer for Batch Restrictions.
 */
export class BatchRestrictionService {
  // Shared Instance
  private static instance: BatchRestrictionService;

  static get shared(): BatchRestrictionService {
    return this.instance || (this.instance = new this());
  }

  /**
   * Adds a restriction to the students of the given application numbers.
   * @param payload restriction, application numbers, and note for the batch.
   */
  createBatchRestriction(payload: BatchRestrictionAPIInDTO): Promise<void> {
    return ApiClient.BatchRestrictionApi.createBatchRestriction(payload);
  }

  /**
   * Gets the batch restriction submissions.
   * @returns batch restriction submissions.
   */
  getBatchRestrictions(): Promise<BatchRestrictionSummaryAPIOutDTO[]> {
    return ApiClient.BatchRestrictionApi.getBatchRestrictions();
  }
}
