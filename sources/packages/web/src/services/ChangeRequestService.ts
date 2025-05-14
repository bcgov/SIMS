import ApiClient from "@/services/http/ApiClient";
import { PaginationOptions } from "@/types";
import {
  PaginatedResultsAPIOutDTO,
  StudentAppealPendingSummaryAPIOutDTO,
} from "./http/dto";

/**
 * Client service layer for Change Request.
 */
export class ChangeRequestService {
  // Shared Instance
  private static instance: ChangeRequestService;

  public static get shared(): ChangeRequestService {
    return this.instance || (this.instance = new this());
  }

  /**
   * Gets all pending student application change requests.
   * @param paginationOptions options to execute the pagination.
   * @returns list of student application change requests.
   */
  async getChangeRequests(
    paginationOptions: PaginationOptions,
  ): Promise<PaginatedResultsAPIOutDTO<StudentAppealPendingSummaryAPIOutDTO>> {
    return ApiClient.ChangeRequestsApi.getChangeRequests(paginationOptions);
  }
}
