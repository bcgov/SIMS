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
  SaveApplicationAPIInDTO,
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
  ApplicationVersionAPIOutDTO,
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
   * @param loadDynamicData flag for if dynamic data should be loaded.
   * @returns application information.
   */
  async getApplication(
    applicationId: number,
    loadDynamicData?: boolean,
  ): Promise<ApplicationSupplementalDataAPIOutDTO> {
    return ApiClient.Application.getApplicationData(
      applicationId,
      loadDynamicData,
    );
  }

  async createApplicationDraft(
    payload: SaveApplicationAPIInDTO,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    return ApiClient.Application.createApplicationDraft(payload);
  }

  async saveApplicationDraft(
    applicationId: number,
    payload: SaveApplicationAPIInDTO,
  ): Promise<void> {
    await ApiClient.Application.saveApplicationDraft(applicationId, payload);
  }

  async submitApplication(
    applicationId: number,
    payload: SaveApplicationAPIInDTO,
  ): Promise<void> {
    await ApiClient.Application.submitApplication(applicationId, payload);
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
   * @param studentId for the student.
   * @returns application details.
   */
  async getApplicationDetail(
    applicationId: number,
    studentId?: number,
  ): Promise<ApplicationBaseAPIOutDTO> {
    return ApiClient.Application.getApplicationDetails(
      applicationId,
      studentId,
    );
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
    applicationNumber: string,
  ): Promise<ApplicationProgramYearAPIOutDTO> {
    return ApiClient.Application.getApplicationForRequestChange(
      applicationNumber,
    );
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
   * Get history of application versions for an application
   * where the current application is excluded.
   * @param applicationId, application id.
   * @returns history of application versions.
   */
  async getApplicationVersionHistory(
    applicationId: number,
  ): Promise<ApplicationVersionAPIOutDTO[]> {
    return ApiClient.Application.getApplicationVersionHistory(applicationId);
  }
}
