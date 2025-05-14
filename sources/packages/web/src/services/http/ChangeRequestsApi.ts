import { getPaginationQueryString } from "@/helpers";
import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import { PaginationOptions } from "@/types";
import {
  PaginatedResultsAPIOutDTO,
  StudentAppealPendingSummaryAPIOutDTO,
} from "./dto";

/**
 * Http API client for Student Appeal.
 */
export class ChangeRequestsApi extends HttpBaseClient {
  /**
   * Gets all pending student application change requests.
   * @param paginationOptions options to execute the pagination.
   * @returns list of student application change requests.
   */
  async getChangeRequests(
    paginationOptions: PaginationOptions,
  ): Promise<PaginatedResultsAPIOutDTO<StudentAppealPendingSummaryAPIOutDTO>> {
    let url = "application-change-request/pending?";
    url += getPaginationQueryString(paginationOptions);
    return this.getCall<
      PaginatedResultsAPIOutDTO<StudentAppealPendingSummaryAPIOutDTO>
    >(this.addClientRoot(url));
  }
}
