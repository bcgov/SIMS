import { PaginationOptions } from "@/types";
import ApiClient from "@/services/http/ApiClient";
import {
  PaginatedResultsAPIOutDTO,
  ApplicationOfferingChangeSummaryAPIOutDTO,
  CompletedApplicationOfferingChangesAPIOutDTO,
  InprogressApplicationOfferingChangesAPIOutDTO,
} from "@/services/http/dto";

export class ApplicationOfferingChangeRequestService {
  // Share Instance
  private static instance: ApplicationOfferingChangeRequestService;

  static get shared(): ApplicationOfferingChangeRequestService {
    return this.instance || (this.instance = new this());
  }

  /**
   * Gets all eligible applications that can be requested for application
   * offering change.
   * @param locationId location id.
   * @param paginationOptions options to execute the pagination.
   * @returns list of eligible applications that can be requested for
   * application offering change.
   */
  async getEligibleApplications(
    locationId: number,
    paginationOptions: PaginationOptions,
  ): Promise<
    PaginatedResultsAPIOutDTO<ApplicationOfferingChangeSummaryAPIOutDTO>
  > {
    return ApiClient.ApplicationOfferingChangeRequestApi.getEligibleApplications(
      locationId,
      paginationOptions,
    );
  }

  /**
   * Gets all in progress application where requested for application
   * offering change.
   * @param locationId location id.
   * @param paginationOptions options to execute the pagination.
   * @returns list of inprogress application that where requested for
   * application offering change.
   */
  async getInprogressApplications(
    locationId: number,
    paginationOptions: PaginationOptions,
  ): Promise<
    PaginatedResultsAPIOutDTO<InprogressApplicationOfferingChangesAPIOutDTO>
  > {
    return ApiClient.ApplicationOfferingChangeRequestApi.getInprogressApplications(
      locationId,
      paginationOptions,
    );
  }

  /**
   * Gets all completed (Approved/ Declined) application where requested
   * for application offering change.
   * @param locationId location id.
   * @param paginationOptions options to execute the pagination.
   * @returns list of completed application that where requested for
   * application offering change.
   */
  async getCompletedApplications(
    locationId: number,
    paginationOptions: PaginationOptions,
  ): Promise<
    PaginatedResultsAPIOutDTO<CompletedApplicationOfferingChangesAPIOutDTO>
  > {
    return ApiClient.ApplicationOfferingChangeRequestApi.getCompletedApplications(
      locationId,
      paginationOptions,
    );
  }
}
