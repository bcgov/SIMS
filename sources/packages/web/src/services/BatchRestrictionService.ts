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
   * Creates a batch restriction for the given application numbers.
   * @param payload restriction to be added, application numbers, and restriction note.
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
