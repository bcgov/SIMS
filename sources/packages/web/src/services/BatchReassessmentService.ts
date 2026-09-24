import ApiClient from "@/services/http/ApiClient";
import {
  BatchReassessmentAPIInDTO,
  BatchSubmissionResultAPIOutDTO,
} from "@/services/http/dto";

/**
 * Client service layer for Batch Reassessments.
 */
export class BatchReassessmentService {
  // Shared Instance
  private static instance: BatchReassessmentService;

  static get shared(): BatchReassessmentService {
    return this.instance || (this.instance = new this());
  }

  /**
   * Runs a batch reassessment for the given application numbers.
   * @param payload application numbers to be reassessed.
   * @returns void.
   */
  async createBatchReassessment(
    payload: BatchReassessmentAPIInDTO,
  ): Promise<void> {
    return ApiClient.BatchReassessmentApi.createBatchReassessment(payload);
  }

  /**
   * Gets batch manual reassessment submissions.
   * @returns batch manual reassessment submissions.
   */
  async getBatchReassessment(): Promise<BatchSubmissionResultAPIOutDTO[]> {
    return ApiClient.BatchReassessmentApi.getBatchReassessments();
  }
}
