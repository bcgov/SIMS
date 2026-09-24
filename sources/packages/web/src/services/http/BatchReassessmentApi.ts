import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import {
  BatchReassessmentAPIInDTO,
  BatchSubmissionResultAPIOutDTO,
} from "@/services/http/dto";

/**
 * Http API client for Batch Reassessments.
 */
export class BatchReassessmentApi extends HttpBaseClient {
  /**
   * Creates a batch reassessment for the given application numbers.
   * @param payload application numbers to be reassessed.
   * @returns void.
   */
  async createBatchReassessment(
    payload: BatchReassessmentAPIInDTO,
  ): Promise<void> {
    await this.postCall(this.addClientRoot("batch-reassessment"), payload);
  }

  /**
   * Gets batch manual reassessment submissions.
   * @returns batch manual reassessment submissions.
   */
  async getBatchReassessments(): Promise<BatchSubmissionResultAPIOutDTO[]> {
    return this.getCall<BatchSubmissionResultAPIOutDTO[]>(
      this.addClientRoot("batch-reassessment"),
    );
  }
}
