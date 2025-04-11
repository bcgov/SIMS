import {
  DataTableSortOrder,
  StudentApplicationFields,
  DEFAULT_PAGE_LIMIT,
  DEFAULT_PAGE_NUMBER,
} from "@/types";
import ApiClient from "../services/http/ApiClient";
import {
  ApplicationSummaryAPIOutDTO,
  PaginatedResultsAPIOutDTO,
  InProgressApplicationDetailsAPIOutDTO,
  ApplicationWithProgramYearAPIOutDTO,
  ApplicationDataAPIOutDTO,
  ApplicationBaseAPIOutDTO,
  ApplicationProgramYearAPIOutDTO,
  PrimaryIdentifierAPIOutDTO,
  ApplicationProgressDetailsAPIOutDTO,
  EnrolmentApplicationDetailsAPIOutDTO,
  CompletedApplicationDetailsAPIOutDTO,
  ApplicationAssessmentStatusDetailsAPIOutDTO,
  ApplicationSupplementalDataAPIOutDTO,
  ApplicationOverallDetailsAPIOutDTO,
  CreateApplicationAPIInDTO,
  SaveApplicationAPIInDTO,
} from "@/services/http/dto";

export class ApplicationService {
  // Share Instance
  private static instance: ApplicationService;

  static get shared(): ApplicationService {
    return this.instance || (this.instance = new this());
  }

  async cancelStudentApplication(applicationId: number): Promise<void> {
    await ApiClient.Application.cancelStudentApplication(applicationId);
  }

  async getApplicationData(
    applicationId: number,
  ): Promise<ApplicationDataAPIOutDTO> {
    return ApiClient.Application.getApplicationData(applicationId);
  }

  /**
   * Get application information for a specified application.
   * @param applicationId the ID of the application to fetch.
   * @param options options for the request.
   * - `studentId` student id for the student.
   * - `loadDynamicData` flag for if dynamic data should be loaded.
   * - `isParentApplication` true if the application is a parent application.
   * @returns application information.
   */
  async getApplication(
    applicationId: number,
    options: {
      studentId?: number;
      loadDynamicData?: boolean;
      isParentApplication?: boolean;
    },
  ): Promise<ApplicationSupplementalDataAPIOutDTO> {
    return ApiClient.Application.getApplicationData(applicationId, options);
  }

  /**
   * Get current application from parent.
   * @param parentApplicationId parent application id.
   * @param options options for the request.
   * - `studentId` student id for the student.
   * @returns application information.
   */
  async getCurrentApplicationFromParent(
    parentApplicationId: number,
    options?: { studentId: number },
  ): Promise<ApplicationSupplementalDataAPIOutDTO> {
    return this.getApplication(parentApplicationId, {
      studentId: options?.studentId,
      isParentApplication: true,
      loadDynamicData: false,
    });
  }

  async createApplicationDraft(
    payload: CreateApplicationAPIInDTO,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    return ApiClient.Application.createApplicationDraft(payload);
  }

  async saveApplicationDraft(
    applicationId: number,
    payload: SaveApplicationAPIInDTO,
  ): Promise<void> {
    await ApiClient.Application.saveApplicationDraft(applicationId, payload);
  }

  /**
   * Submits an application to be processed or a change
   * for a current application previously submitted.
   * @param applicationId application ID.
   * @param payload application data.
   * @param options options for the request.
   * - `isChangeRequest` true if the application is a change request.
   */
  async submitApplication(
    applicationId: number,
    payload: SaveApplicationAPIInDTO,
    options?: { isChangeRequest?: boolean },
  ): Promise<void> {
    if (options?.isChangeRequest) {
      await ApiClient.Application.applicationChangeRequest(
        applicationId,
        payload,
      );
      return;
    }
    await ApiClient.Application.submitApplication(applicationId, payload);
  }

  /**
   * Cancels an in-progress change request for an existing student application.
   * @param applicationId application ID of the change request to be cancelled.
   */
  async applicationCancelChangeRequest(applicationId: number): Promise<void> {
    await ApiClient.Application.applicationCancelChangeRequest(applicationId);
  }

  async getApplicationWithPY(
    applicationId: number,
    isIncludeInActiveProgramYear?: boolean,
  ): Promise<ApplicationWithProgramYearAPIOutDTO> {
    return ApiClient.Application.getApplicationWithPY(
      applicationId,
      isIncludeInActiveProgramYear,
    );
  }

  /**
   * Get application detail of given application.
   * @param applicationId for the application.
   * @param options related options.
   * - `studentId` student id for the student.
   * - `isParentApplication` is parent application if true, loads the parent application.
   * @returns application details.
   */
  async getApplicationDetail(
    applicationId: number,
    options?: {
      studentId?: number;
      isParentApplication?: boolean;
    },
  ): Promise<ApplicationBaseAPIOutDTO> {
    return ApiClient.Application.getApplicationDetails(applicationId, options);
  }

  /**
   * Get the list of applications that belongs to a student on a summary view format.
   * @param page page number.
   * @param pageCount limit of the page.
   * @param sortField field to be sorted.
   * @param sortOrder order to be sorted.
   * @param studentId student id. Used only for AEST.
   * @returns student application list with total count.
   */
  async getStudentApplicationSummary(
    page = DEFAULT_PAGE_NUMBER,
    pageCount = DEFAULT_PAGE_LIMIT,
    sortField?: StudentApplicationFields,
    sortOrder?: DataTableSortOrder,
    studentId?: number,
  ): Promise<PaginatedResultsAPIOutDTO<ApplicationSummaryAPIOutDTO>> {
    return ApiClient.Application.getStudentApplicationSummary(
      page,
      pageCount,
      sortField,
      sortOrder,
      studentId,
    );
  }

  async getApplicationForRequestChange(
    applicationId: number,
  ): Promise<ApplicationProgramYearAPIOutDTO> {
    return ApiClient.Application.getApplicationForRequestChange(applicationId);
  }

  /**
   * Get in progress details of an application by application id.
   * @param applicationId application id.
   * @returns application details.
   */
  async getInProgressApplicationDetails(
    applicationId: number,
  ): Promise<InProgressApplicationDetailsAPIOutDTO> {
    return ApiClient.Application.getInProgressApplicationDetails(applicationId);
  }

  /**
   * Get status of all requests and confirmations in student application (Exception, PIR and COE).
   * @param applicationId Student application.
   * @returns application progress details.
   */
  async getApplicationProgressDetails(
    applicationId: number,
  ): Promise<ApplicationProgressDetailsAPIOutDTO> {
    return ApiClient.Application.getApplicationProgressDetails(applicationId);
  }

  /**
   * Get details for the application enrolment status of a student application.
   * @param applicationId student application id.
   * @returns details for the application enrolment status.
   */
  async getEnrolmentApplicationDetails(
    applicationId: number,
  ): Promise<EnrolmentApplicationDetailsAPIOutDTO> {
    return ApiClient.Application.getEnrolmentApplicationDetails(applicationId);
  }

  /**
   * Get details for an application on at completed status.
   * @param applicationId application id.
   * @returns details for an application on at completed status.
   */
  async getCompletedApplicationDetails(
    applicationId: number,
  ): Promise<CompletedApplicationDetailsAPIOutDTO> {
    return ApiClient.Application.getCompletedApplicationDetails(applicationId);
  }

  /**
   * Creates a new MSFAA number to be associated with the student, cancelling any
   * pending MSFAA for the particular offering intensity and also associating the
   * new MSFAA number to any pending disbursement for the same offering intensity.
   * @param applicationId reference application id.
   */
  async reissueMSFAA(applicationId: number): Promise<void> {
    await ApiClient.Application.reissueMSFAA(applicationId);
  }

  /**
   * Gets application and assessment status details.
   * @param applicationId application id.
   * @returns application and assessment details.
   */
  async getApplicationAssessmentStatusDetails(
    applicationId: number,
  ): Promise<ApplicationAssessmentStatusDetailsAPIOutDTO> {
    return ApiClient.Application.getApplicationAssessmentStatusDetails(
      applicationId,
    );
  }

  /**
   * Get application overall details for an application.
   * @param applicationId, application id.
   * @returns application overall details list.
   */
  async getApplicationOverallDetails(
    applicationId: number,
  ): Promise<ApplicationOverallDetailsAPIOutDTO> {
    return ApiClient.Application.getApplicationOverallDetails(applicationId);
  }
}
