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
  StudentApplicationOfferingChangeRequestAPIInDTO,
  ApplicationOfferingDetailsAPIOutDTO,
  ApplicationOfferingChangeRequestStatusAPIOutDTO,
  ApplicationOfferingChangeDetailsAPIOutDTO,
  ApplicationOfferingChangeAssessmentAPIInDTO,
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
   * Gets all in progress application offering request changes.
   * @param paginationOptions options to execute the pagination.
   * @returns list of inprogress application offering request changes.
   */
  async getAllInProgressApplications(
    paginationOptions: PaginationOptions,
  ): Promise<
    PaginatedResultsAPIOutDTO<InProgressApplicationOfferingChangesAPIOutDTO>
  > {
    return ApiClient.ApplicationOfferingChangeRequestApi.getAllInProgressApplications(
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
   * Gets the Application Offering Change Request details for institution.
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
   * Gets the Application Offering Change Request details for ministry view.
   * @param applicationOfferingChangeRequestId the Application Offering Change Request id.
   * @returns Application Offering Change Request details.
   */
  async getApplicationOfferingDetailsForReview(
    applicationOfferingChangeRequestId: number,
  ): Promise<ApplicationOfferingChangeDetailsAPIOutDTO> {
    return ApiClient.ApplicationOfferingChangeRequestApi.getApplicationOfferingDetailsForReview(
      applicationOfferingChangeRequestId,
    );
  }

  /**
   * Gets the Application Offering Change Request details for student view.
   * @param applicationOfferingChangeRequestId the Application Offering Change Request id.
   * @returns Application Offering Change Request details.
   */
  async getApplicationOfferingDetails(
    applicationOfferingChangeRequestId: number,
  ): Promise<ApplicationOfferingDetailsAPIOutDTO> {
    return ApiClient.ApplicationOfferingChangeRequestApi.getApplicationOfferingDetails(
      applicationOfferingChangeRequestId,
    );
  }

  /**
   * Gets the Application Offering Change Request status.
   * @param applicationOfferingChangeRequestId the application offering change request id.
   * @returns the application offering change request status.
   */
  async getApplicationOfferingChangeRequestStatus(
    applicationOfferingChangeRequestId: number,
  ): Promise<ApplicationOfferingChangeRequestStatusAPIOutDTO> {
    return ApiClient.ApplicationOfferingChangeRequestApi.getApplicationOfferingChangeRequestStatus(
      applicationOfferingChangeRequestId,
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

  /**
   * Update the application offering change request status.
   * @param applicationOfferingChangeRequestId application offering change request id.
   * @param payload information to update the application offering change request.
   */
  async updateApplicationOfferingChangeRequestStatus(
    applicationOfferingChangeRequestId: number,
    payload: StudentApplicationOfferingChangeRequestAPIInDTO,
  ): Promise<void> {
    await ApiClient.ApplicationOfferingChangeRequestApi.updateApplicationOfferingChangeRequestStatus(
      applicationOfferingChangeRequestId,
      payload,
    );
  }

  /**
   * Approves or declines the application offering change request status.
   * @param applicationOfferingChangeRequestId application offering change request id.
   * @param payload information to update the application offering change request.
   */
  async updateAESTApplicationOfferingChangeRequestStatus(
    applicationOfferingChangeRequestId: number,
    payload: ApplicationOfferingChangeAssessmentAPIInDTO,
  ): Promise<void> {
    await ApiClient.ApplicationOfferingChangeRequestApi.updateApplicationOfferingChangeRequestStatus(
      applicationOfferingChangeRequestId,
      payload,
    );
  }
}
