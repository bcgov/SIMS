import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import { getPaginationQueryString } from "@/helpers";
import {
  BatchRestrictionAPIInDTO,
  BatchRestrictionDetailsAPIOutDTO,
  BatchRestrictionStudentAPIOutDTO,
  BatchRestrictionSummaryAPIOutDTO,
  PaginatedResultsAPIOutDTO,
} from "@/services/http/dto";
import { PaginationOptions } from "@/types";

/**
 * Http API client for Batch Restrictions.
 */
export class BatchRestrictionApi extends HttpBaseClient {
  /**
   * Creates a batch restriction for the given application numbers.
   * @param payload restriction to be added, application numbers, and restriction note.
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

  /**
   * Gets the details of a batch restriction submission.
   * @param batchRestrictionId batch restriction ID.
   * @returns batch restriction details.
   */
  getBatchRestriction(
    batchRestrictionId: number,
  ): Promise<BatchRestrictionDetailsAPIOutDTO> {
    return this.getCall(
      this.addClientRoot(`batch-restriction/${batchRestrictionId}`),
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
    const url = `batch-restriction/${batchRestrictionId}/students?${getPaginationQueryString(paginationOptions)}`;
    return this.getCall(this.addClientRoot(url));
  }
}
