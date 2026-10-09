import { getPaginationQueryString } from "@/helpers";
import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import {
  BatchReassessmentAPIInDTO,
  BatchReassessmentApplicationAPIOutDTO,
  BatchReassessmentSummaryAPIOutDTO,
  PaginatedResultsAPIOutDTO,
} from "@/services/http/dto";
import { BatchReassessmentApplicationResult, PaginationOptions } from "@/types";

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
   * Gets the reassessment outcome of each application in a batch manual reassessment.
   * @param batchReassessmentId batch manual reassessment ID.
   * @param paginationOptions pagination options, with the application number as search criteria.
   * @param result optional reassessment result to filter by.
   * @returns paginated application outcomes ordered by application number.
   */
  async getBatchReassessmentApplications(
    batchReassessmentId: number,
    paginationOptions: PaginationOptions,
    result?: BatchReassessmentApplicationResult,
  ): Promise<PaginatedResultsAPIOutDTO<BatchReassessmentApplicationAPIOutDTO>> {
    let url = `batch-reassessment/${batchReassessmentId}/applications?${getPaginationQueryString(paginationOptions)}`;
    if (result) {
      url += `&result=${result}`;
    }
    return this.getCall(this.addClientRoot(url));
  }
}
