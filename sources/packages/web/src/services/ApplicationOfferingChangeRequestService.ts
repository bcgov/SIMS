import { PaginationOptions } from "@/types";
import ApiClient from "@/services/http/ApiClient";
import {
  PaginatedResultsAPIOutDTO,
  ApplicationOfferingChangeSummaryAPIOutDTO,
  ApplicationOfferingChangeAPIOutDTO,
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

  // todo: ann double check,

  /**
   * Gets all in progress application where requested for application
   * offering change.
   * @param locationId location id.
   * @param paginationOptions options to execute the pagination.
   * @returns list of inprogress application that where requested for
   * application offering change.
   */
  async getInprogressApplicationOfferingChangeRecords(
    locationId: number,
    paginationOptions: PaginationOptions,
  ): Promise<PaginatedResultsAPIOutDTO<ApplicationOfferingChangeAPIOutDTO>> {
    return ApiClient.ApplicationOfferingChangeRequestApi.getInprogressApplicationOfferingChangeRecords(
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
  async getCompletedApplicationOfferingChangeRecords(
    locationId: number,
    paginationOptions: PaginationOptions,
  ): Promise<PaginatedResultsAPIOutDTO<ApplicationOfferingChangeAPIOutDTO>> {
    return ApiClient.ApplicationOfferingChangeRequestApi.getCompletedApplicationOfferingChangeRecords(
      locationId,
      paginationOptions,
    );
  }
}
