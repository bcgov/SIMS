import { addPaginationOptions, addSortOptions } from "@/helpers";
import {
  DEFAULT_PAGE_NUMBER,
  DEFAULT_PAGE_LIMIT,
  StudentApplicationFields,
  DataTableSortOrder,
} from "@/types";
import HttpBaseClient from "./common/HttpBaseClient";
import {
  ApplicationSummaryAPIOutDTO,
  PaginatedResultsAPIOutDTO,
  SaveApplicationAPIInDTO,
  ApplicationWithProgramYearAPIOutDTO,
  ApplicationDataAPIOutDTO,
  ApplicationBaseAPIOutDTO,
  ApplicationProgramYearAPIOutDTO,
  InProgressApplicationDetailsAPIOutDTO,
  PrimaryIdentifierAPIOutDTO,
  ApplicationProgressDetailsAPIOutDTO,
  EnrolmentApplicationDetailsAPIOutDTO,
  CompletedApplicationDetailsAPIOutDTO,
  ApplicationAssessmentStatusDetailsAPIOutDTO,
  ApplicationSupplementalDataAPIOutDTO,
  ApplicationOverallDetailsAPIOutDTO,
  CreateApplicationAPIInDTO,
} from "@/services/http/dto";

export class ApplicationApi extends HttpBaseClient {
  async getApplicationData(
    applicationId: number,
  ): Promise<ApplicationDataAPIOutDTO>;

  async getApplicationData(
    applicationId: number,
    options: { loadDynamicData?: boolean; isParentApplication?: boolean },
  ): Promise<ApplicationSupplementalDataAPIOutDTO>;

  async getApplicationData(
    applicationId: number,
    options?: {
      studentId?: number;
      loadDynamicData?: boolean;
      isParentApplication?: boolean;
    },
  ): Promise<ApplicationDataAPIOutDTO | ApplicationSupplementalDataAPIOutDTO> {
    let url = this.addClientRoot("application");
    if (options?.studentId) {
      url = `${url}/student/${options.studentId}/application/${applicationId}`;
    } else {
      url = `${url}/${applicationId}`;
    }
    const isLoadDynamicDataPresent = options?.loadDynamicData !== undefined;
    if (isLoadDynamicDataPresent) {
      url = `${url}?loadDynamicData=${options.loadDynamicData}`;
    }
    if (options?.isParentApplication) {
      const query = isLoadDynamicDataPresent
        ? `&isParentApplication=${options?.isParentApplication}`
        : `?isParentApplication=${options?.isParentApplication}`;
      url = `${url}${query}`;
    }
    return this.getCall<
      ApplicationDataAPIOutDTO | ApplicationSupplementalDataAPIOutDTO
    >(url);
  }

  async cancelStudentApplication(applicationId: number): Promise<void> {
    await this.patchCall(
      this.addClientRoot(`application/${applicationId}/cancel`),
      null,
    );
  }

  async createApplicationDraft(
    payload: CreateApplicationAPIInDTO,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    return this.postCall<CreateApplicationAPIInDTO>(
      this.addClientRoot("application/draft"),
      payload,
    );
  }

  async saveApplicationDraft(
    applicationId: number,
    payload: SaveApplicationAPIInDTO,
  ): Promise<void> {
    await this.patchCall<SaveApplicationAPIInDTO>(
      this.addClientRoot(`application/${applicationId}/draft`),
      payload,
    );
  }

  async submitApplication(
    applicationId: number,
    payload: SaveApplicationAPIInDTO,
  ): Promise<void> {
    await this.patchCall(
      this.addClientRoot(`application/${applicationId}/submit`),
      payload,
    );
  }

  /**
   * Starts a change request for an existing student application.
   * A new application will be created in edited status and will be assessed by the Ministry.
   * @param applicationId application ID to be changed.
   * @param payload complete application payload with all the data that should be considered as a new
   * application, if approved by the Ministry.
   * @returns application ID of the created application that represents the change request.
   */
  async applicationChangeRequest(
    applicationId: number,
    payload: SaveApplicationAPIInDTO,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    return this.postCall<SaveApplicationAPIInDTO>(
      this.addClientRoot(`application/${applicationId}/change-request`),
      payload,
    );
  }

  /**
   * Cancels an in-progress change request for an existing student application.
   * @param applicationId application ID of the change request to be cancelled.
   */
  async applicationCancelChangeRequest(applicationId: number): Promise<void> {
    await this.patchCall(
      this.addClientRoot(`application/${applicationId}/cancel-change-request`),
      null,
    );
  }

  async getApplicationWithPY(
    applicationId: number,
    isIncludeInActiveProgramYear?: boolean,
  ): Promise<ApplicationWithProgramYearAPIOutDTO> {
    let url = this.addClientRoot(`application/${applicationId}/program-year`);
    if (isIncludeInActiveProgramYear) {
      url = `${url}?isIncludeInActiveProgramYear=${isIncludeInActiveProgramYear}`;
    }
    return this.getCall<ApplicationWithProgramYearAPIOutDTO>(url);
  }

  /**
   * API Client for application detail.
   * @param applicationId for the application.
   * @param options related options.
   * - `studentId` student id for the student.
   * - `isParentApplication` is parent application if true, loads the parent application.
   * @returns application details.
   */
  async getApplicationDetails(
    applicationId: number,
    options?: {
      studentId?: number;
      isParentApplication?: boolean;
    },
  ): Promise<ApplicationBaseAPIOutDTO> {
    let url = options?.studentId
      ? `application/student/${options?.studentId}/application/${applicationId}`
      : `application/${applicationId}`;
    if (options?.isParentApplication !== undefined) {
      url = `${url}?isParentApplication=${options?.isParentApplication}`;
    }
    return this.getCall<ApplicationBaseAPIOutDTO>(this.addClientRoot(url));
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
    let url = studentId
      ? `student/${studentId}/application-summary`
      : "student/application-summary";
    // Adding pagination params. There is always a default page and pageCount for paginated APIs.
    url = addPaginationOptions(url, page, pageCount, "?");
    //Adding Sort params. There is always a default sortField and sortOrder for COE.
    url = addSortOptions(url, sortField, sortOrder);
    return this.getCall<PaginatedResultsAPIOutDTO<ApplicationSummaryAPIOutDTO>>(
      this.addClientRoot(url),
    );
  }

  async getApplicationForRequestChange(
    applicationId: number,
  ): Promise<ApplicationProgramYearAPIOutDTO> {
    return this.getCall<ApplicationProgramYearAPIOutDTO>(
      this.addClientRoot(`application/${applicationId}/appeal`),
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
    return this.getCall<InProgressApplicationDetailsAPIOutDTO>(
      this.addClientRoot(`application/${applicationId}/in-progress`),
    );
  }

  /**
   * Get status of all requests and confirmations in student application (Exception, PIR and COE).
   * @param applicationId Student application.
   * @returns application progress details.
   */
  async getApplicationProgressDetails(
    applicationId: number,
  ): Promise<ApplicationProgressDetailsAPIOutDTO> {
    return this.getCall<ApplicationProgressDetailsAPIOutDTO>(
      this.addClientRoot(`application/${applicationId}/progress-details`),
    );
  }

  /**
   * Get details for the application enrolment status of a student application.
   * @param applicationId student application id.
   * @returns details for the application enrolment status.
   */
  async getEnrolmentApplicationDetails(
    applicationId: number,
  ): Promise<EnrolmentApplicationDetailsAPIOutDTO> {
    return this.getCall<EnrolmentApplicationDetailsAPIOutDTO>(
      this.addClientRoot(`application/${applicationId}/enrolment`),
    );
  }

  /**
   * Get details for an application on at completed status.
   * @param applicationId application id.
   * @returns details for an application on at completed status.
   */
  async getCompletedApplicationDetails(
    applicationId: number,
  ): Promise<CompletedApplicationDetailsAPIOutDTO> {
    return this.getCall<CompletedApplicationDetailsAPIOutDTO>(
      this.addClientRoot(`application/${applicationId}/completed`),
    );
  }

  /**
   * Creates a new MSFAA number to be associated with the student, cancelling any
   * pending MSFAA for the particular offering intensity and also associating the
   * new MSFAA number to any pending disbursement for the same offering intensity.
   * @param applicationId reference application id.
   */
  async reissueMSFAA(applicationId: number): Promise<void> {
    await this.postCall(
      this.addClientRoot(`application/${applicationId}/reissue-msfaa`),
      null,
    );
  }

  /**
   * Gets application and assessment status details.
   * @param applicationId application id.
   * @returns application and assessment details.
   */
  async getApplicationAssessmentStatusDetails(
    applicationId: number,
  ): Promise<ApplicationAssessmentStatusDetailsAPIOutDTO> {
    return this.getCall(
      this.addClientRoot(`application/${applicationId}/assessment-details`),
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
    const endpoint = `application/${applicationId}/overall-details`;
    return this.getCall<ApplicationOverallDetailsAPIOutDTO>(
      this.addClientRoot(endpoint),
    );
  }
}
