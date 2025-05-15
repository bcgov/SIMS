import { getPaginationQueryString } from "@/helpers";
import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import { PaginationOptions } from "@/types";
import { PaginatedResultsAPIOutDTO } from "./dto";
import { ApplicationChangeRequestPendingSummaryAPIOutDTO } from "./dto/ApplicationChangeRequest.dto";

/**
 * Http API client for Application Change Requests (pending edits).
 */
export class ChangeRequestsApi extends HttpBaseClient {
  /**
   * Gets all pending application change requests (applications in 'Change pending approval' status).
   * @param paginationOptions options to execute the pagination.
   * @returns list of application change requests.
   */
  async getChangeRequests(
    paginationOptions: PaginationOptions,
  ): Promise<
    PaginatedResultsAPIOutDTO<ApplicationChangeRequestPendingSummaryAPIOutDTO>
  > {
    let url = "application-change-request/pending?";
    url += getPaginationQueryString(paginationOptions);
    return this.getCall<
      PaginatedResultsAPIOutDTO<ApplicationChangeRequestPendingSummaryAPIOutDTO>
    >(this.addClientRoot(url));
  }
}
