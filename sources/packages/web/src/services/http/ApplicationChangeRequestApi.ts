import { getPaginationQueryString } from "@/helpers";
import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import { PaginatedResultsAPIOutDTO } from "@/services/http/dto";
import {
  ApplicationChangeRequestAPIInDTO,
  ApplicationChangeRequestPendingSummaryAPIOutDTO,
} from "@/services/http/dto/ApplicationChangeRequest.dto";
import { PaginationOptions } from "@/types";

export class ApplicationChangeRequestApi extends HttpBaseClient {
  /**
   * Assesses an application change request.
   * @param applicationId application id.
   * @param payload information to update the application change request status.
   */
  async assessApplicationChangeRequest(
    applicationId: number,
    payload: ApplicationChangeRequestAPIInDTO,
  ): Promise<void> {
    const url = `application-change-request/${applicationId}`;
    await this.patchCall(this.addClientRoot(url), payload);
  }

  /**
   * Gets all pending application change requests (applications in 'Change pending approval' status).
   * @param paginationOptions options to execute the pagination.
   * @returns list of application change requests.
   */
  async getApplicationChangeRequests(
    paginationOptions: PaginationOptions,
  ): Promise<
    PaginatedResultsAPIOutDTO<ApplicationChangeRequestPendingSummaryAPIOutDTO>
  > {
    let url = "application-change-request/pending?";
    url += getPaginationQueryString(paginationOptions, true);
    return this.getCall<
      PaginatedResultsAPIOutDTO<ApplicationChangeRequestPendingSummaryAPIOutDTO>
    >(this.addClientRoot(url));
  }
}
