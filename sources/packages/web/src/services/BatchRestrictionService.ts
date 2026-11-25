import ApiClient from "@/services/http/ApiClient";
import {
  BatchRestrictionAPIInDTO,
  BatchRestrictionDetailsAPIOutDTO,
  BatchRestrictionStudentAPIOutDTO,
  BatchRestrictionSummaryAPIOutDTO,
  PaginatedResultsAPIOutDTO,
} from "@/services/http/dto";
import { PaginationOptions } from "@/types";

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

  /**
   * Gets the details of a batch restriction submission.
   * @param batchRestrictionId batch restriction ID.
   * @returns batch restriction details.
   */
  getBatchRestriction(
    batchRestrictionId: number,
  ): Promise<BatchRestrictionDetailsAPIOutDTO> {
    return ApiClient.BatchRestrictionApi.getBatchRestriction(
      batchRestrictionId,
    );
  }

  /**
   * Gets the restriction outcome of all students in a batch restriction.
   * @param batchRestrictionId batch restriction ID.
   * @param paginationOptions pagination options, with the application number (`searchCriteria`)
   * used to find the students and optional `result` filter as search criteria.
   * @returns paginated student outcomes ordered by application number.
   */
  getBatchRestrictionStudents(
    batchRestrictionId: number,
    paginationOptions: PaginationOptions,
  ): Promise<PaginatedResultsAPIOutDTO<BatchRestrictionStudentAPIOutDTO>> {
    return ApiClient.BatchRestrictionApi.getBatchRestrictionStudents(
      batchRestrictionId,
      paginationOptions,
    );
  }
}
