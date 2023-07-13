import { PaginationOptions } from "@/types";
import ApiClient from "@/services/http/ApiClient";
import {
  PaginatedResultsAPIOutDTO,
  ApplicationOfferingChangeSummaryAPIOutDTO,
  CompletedApplicationOfferingChangesAPIOutDTO,
  InProgressApplicationOfferingChangesAPIOutDTO,
  ApplicationOfferingChangesAPIOutDTO,
  ApplicationOfferingChangeSummaryDetailAPIOutDTO,
  CreateApplicationOfferingChangeRequestAPIInDTO,
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
    return ApiClient.ApplicationOfferingChangeRequestApi.getEligibleApplication(
      locationId,
      applicationId,
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
    return ApiClient.ApplicationOfferingChangeRequestApi.getInProgressApplications(
      locationId,
      paginationOptions,
    );
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
    return ApiClient.ApplicationOfferingChangeRequestApi.getCompletedApplications(
      locationId,
      paginationOptions,
    );
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
    return ApiClient.ApplicationOfferingChangeRequestApi.getById(
      applicationOfferingChangeRequestId,
      { locationId: options?.locationId },
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
    await ApiClient.ApplicationOfferingChangeRequestApi.createApplicationOfferingChangeRequest(
      locationId,
      payload,
    );
  }
}
