import { getPaginationQueryString } from "@/helpers";
import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import {
  BatchReassessmentAPIInDTO,
  BatchReassessmentApplicationAPIOutDTO,
  BatchReassessmentSummaryAPIOutDTO,
  PaginatedResultsAPIOutDTO,
} from "@/services/http/dto";
import { PaginationOptions } from "@/types";

/**
 * Http API client for Batch Reassessments.
 */
export class BatchReassessmentApi extends HttpBaseClient {
  /**
   * Creates a batch reassessment for the given application numbers.
   * @param payload application numbers to be reassessed.
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
  async getBatchReassessments(): Promise<BatchReassessmentSummaryAPIOutDTO[]> {
    return this.getCall(this.addClientRoot("batch-reassessment"));
  }

  /**
   * Gets the reassessment outcome of all applications in a batch manual reassessment.
   * @param batchReassessmentId batch manual reassessment ID.
   * @param paginationOptions pagination options, with the application number
   * (`searchCriteria`) and optional `result` filter as search criteria.
   * @returns paginated application outcomes ordered by application number.
   */
  async getBatchReassessmentApplications(
    batchReassessmentId: number,
    paginationOptions: PaginationOptions,
  ): Promise<PaginatedResultsAPIOutDTO<BatchReassessmentApplicationAPIOutDTO>> {
    const url = `batch-reassessment/${batchReassessmentId}/applications?${getPaginationQueryString(paginationOptions)}`;
    return this.getCall(this.addClientRoot(url));
  }
}
