import {
  PaginatedResultsAPIOutDTO,
  ApplicationChangeRequestAPIInDTO,
  ApplicationChangeRequestPendingSummaryAPIOutDTO,
} from "@/services/http/dto";
import { PaginationOptions } from "@/types";
import ApiClient from "../services/http/ApiClient";

export class ApplicationChangeRequestService {
  // Share Instance
  private static instance: ApplicationChangeRequestService;

  static get shared(): ApplicationChangeRequestService {
    return this.instance || (this.instance = new this());
  }

  /**
   * Assesses an application change request.
   * @param applicationId application id.
   * @param payload information to update the application change request status.
   */
  async assessApplicationChangeRequest(
    applicationId: number,
    payload: ApplicationChangeRequestAPIInDTO,
  ): Promise<void> {
    await ApiClient.ApplicationChangeRequestApi.assessApplicationChangeRequest(
      applicationId,
      payload,
    );
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
    return ApiClient.ApplicationChangeRequestApi.getApplicationChangeRequests(
      paginationOptions,
    );
  }
}
