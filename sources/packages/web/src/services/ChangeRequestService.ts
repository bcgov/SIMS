import ApiClient from "@/services/http/ApiClient";
import { PaginationOptions } from "@/types";
import { PaginatedResultsAPIOutDTO } from "./http/dto";
import { ApplicationChangeRequestPendingSummaryAPIOutDTO } from "./http/dto/ApplicationChangeRequest.dto";

/**
 * Client service layer for Application Change Requests (pending edits).
 */
export class ChangeRequestService {
  // Shared Instance
  private static instance: ChangeRequestService;

  public static get shared(): ChangeRequestService {
    return this.instance || (this.instance = new this());
  }

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
    return ApiClient.ChangeRequestsApi.getChangeRequests(paginationOptions);
  }
}
