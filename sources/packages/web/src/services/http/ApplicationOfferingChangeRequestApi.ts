import HttpBaseClient from "./common/HttpBaseClient";
import { PaginationOptions } from "@/types";
import {
  PaginatedResultsAPIOutDTO,
  ApplicationOfferingChangeSummaryAPIOutDTO,
  ApplicationOfferingChangeAPIOutDTO,
} from "@/services/http/dto";
import { getPaginationQueryString } from "@/helpers";

export class ApplicationOfferingChangeRequestApi extends HttpBaseClient {
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
    let url = `location/${locationId}/application-offering-change-request/available?`;
    url += getPaginationQueryString(paginationOptions, true);
    return this.getCall<
      PaginatedResultsAPIOutDTO<ApplicationOfferingChangeSummaryAPIOutDTO>
    >(this.addClientRoot(url));
  }

  // todo: ann change the below 2 endpoint and check all dto and code
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
    let url = `location/${locationId}/request-change/in-progress?`;
    url += getPaginationQueryString(paginationOptions, true);
    return this.getCall<
      PaginatedResultsAPIOutDTO<ApplicationOfferingChangeAPIOutDTO>
    >(this.addClientRoot(url));
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
    let url = `location/${locationId}/request-change/completed?`;
    url += getPaginationQueryString(paginationOptions, true);
    return this.getCall<
      PaginatedResultsAPIOutDTO<ApplicationOfferingChangeAPIOutDTO>
    >(this.addClientRoot(url));
  }
}
