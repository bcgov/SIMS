import HttpBaseClient from "./common/HttpBaseClient";
import { PaginationOptions } from "@/types";
import {
  PaginatedResultsAPIOutDTO,
  ApplicationOfferingChangeSummaryAPIOutDTO,
  CompletedApplicationOfferingChangesAPIOutDTO,
  InProgressApplicationOfferingChangesAPIOutDTO,
  ApplicationOfferingChangesAPIOutDTO,
  ApplicationOfferingChangeSummaryDetailAPIOutDTO,
  CreateApplicationOfferingChangeRequestAPIInDTO,
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

  /**
   * Gets an eligible application that can be requested for application
   * offering change.
   * @param locationId location id.
   * @param applicationId application id.
   * @returns eligible application.
   */
  async getEligibleApplication(
    locationId: number,
    applicationId: number,
  ): Promise<ApplicationOfferingChangeSummaryDetailAPIOutDTO> {
    const url = `location/${locationId}/application-offering-change-request/available/application/${applicationId}`;
    return this.getCall<ApplicationOfferingChangeSummaryDetailAPIOutDTO>(
      this.addClientRoot(url),
    );
  }

  /**
   * Gets all in progress application offering request changes.
   * @param locationId location id.
   * @param paginationOptions options to execute the pagination.
   * @returns list of inprogress application offering request changes.
   */
  async getInProgressApplications(
    locationId: number,
    paginationOptions: PaginationOptions,
  ): Promise<
    PaginatedResultsAPIOutDTO<InProgressApplicationOfferingChangesAPIOutDTO>
  > {
    let url = `location/${locationId}/application-offering-change-request/in-progress?`;
    url += getPaginationQueryString(paginationOptions, true);
    return this.getCall<
      PaginatedResultsAPIOutDTO<InProgressApplicationOfferingChangesAPIOutDTO>
    >(this.addClientRoot(url));
  }

  /**
   * Gets all completed (Approved/ Declined) application offering request changes.
   * @param locationId location id.
   * @param paginationOptions options to execute the pagination.
   * @returns list of completed application offering request changes.
   */
  async getCompletedApplications(
    locationId: number,
    paginationOptions: PaginationOptions,
  ): Promise<
    PaginatedResultsAPIOutDTO<CompletedApplicationOfferingChangesAPIOutDTO>
  > {
    let url = `location/${locationId}/application-offering-change-request/completed?`;
    url += getPaginationQueryString(paginationOptions, true);
    return this.getCall<
      PaginatedResultsAPIOutDTO<CompletedApplicationOfferingChangesAPIOutDTO>
    >(this.addClientRoot(url));
  }

  /**
   * Gets the Application Offering Change Request details.
   * @param applicationOfferingChangeRequestId the Application Offering Change Request id.
   * @param options method options:
   * - `locationId`: location for authorization.
   * @returns Application Offering Change Request details.
   */
  async getById(
    applicationOfferingChangeRequestId: number,
    options?: {
      locationId?: number;
    },
  ): Promise<ApplicationOfferingChangesAPIOutDTO> {
    const url = options?.locationId
      ? `location/${options.locationId}/application-offering-change-request/${applicationOfferingChangeRequestId}`
      : `application-offering-change-request/${applicationOfferingChangeRequestId}`;
    return this.getCall<ApplicationOfferingChangesAPIOutDTO>(
      this.addClientRoot(url),
    );
  }

  /**
   * Creates a new application offering change request.
   * @param locationId location id.
   * @param payload information to create the new request.
   */
  async createApplicationOfferingChangeRequest(
    locationId: number,
    payload: CreateApplicationOfferingChangeRequestAPIInDTO,
  ): Promise<void> {
    const url = `location/${locationId}/application-offering-change-request`;
    await this.postCall(this.addClientRoot(url), payload);
  }
}
