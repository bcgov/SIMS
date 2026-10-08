import ApiClient from "@/services/http/ApiClient";
import {
  BatchReassessmentAPIInDTO,
  BatchReassessmentApplicationAPIOutDTO,
  BatchReassessmentSummaryAPIOutDTO,
  PaginatedResultsAPIOutDTO,
} from "@/services/http/dto";
import { PaginationOptions } from "@/types";

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
  async getBatchReassessments(): Promise<BatchReassessmentSummaryAPIOutDTO[]> {
    return ApiClient.BatchReassessmentApi.getBatchReassessments();
  }

  /**
   * Gets the reassessment outcome of each application in a batch manual reassessment.
   * @param batchReassessmentId batch manual reassessment ID.
   * @param paginationOptions pagination options, with optional search criteria
   * `applicationNumber` and `result`.
   * @returns paginated application outcomes ordered by application number.
   */
  async getBatchReassessmentApplications(
    batchReassessmentId: number,
    paginationOptions: PaginationOptions,
  ): Promise<PaginatedResultsAPIOutDTO<BatchReassessmentApplicationAPIOutDTO>> {
    return ApiClient.BatchReassessmentApi.getBatchReassessmentApplications(
      batchReassessmentId,
      paginationOptions,
    );
  }
}
