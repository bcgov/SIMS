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
  ApplicationIdentifiersAPIOutDTO,
  InProgressApplicationDetailsAPIOutDTO,
  PrimaryIdentifierAPIOutDTO,
  ApplicationProgressDetailsAPIOutDTO,
  EnrolmentApplicationDetailsAPIOutDTO,
  CompletedApplicationDetailsAPIOutDTO,
} from "@/services/http/dto";

export class ApplicationApi extends HttpBaseClient {
  async getApplicationData(
    applicationId: number,
  ): Promise<ApplicationDataAPIOutDTO> {
    return this.getCall<ApplicationDataAPIOutDTO>(
      this.addClientRoot(`application/${applicationId}`),
    );
  }

  async cancelStudentApplication(applicationId: number): Promise<void> {
    await this.patchCall(
      this.addClientRoot(`application/${applicationId}/cancel`),
      null,
    );
  }

  async createApplicationDraft(
    payload: SaveApplicationAPIInDTO,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    return this.postCall<SaveApplicationAPIInDTO>(
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
   * @param studentId for the student.
   * @returns application details.
   */
  async getApplicationDetails(
    applicationId: number,
    studentId?: number,
  ): Promise<ApplicationBaseAPIOutDTO> {
    const url = studentId
      ? `application/student/${studentId}/application/${applicationId}`
      : `application/${applicationId}`;
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
    applicationNumber: string,
  ): Promise<ApplicationIdentifiersAPIOutDTO> {
    return this.getCall<ApplicationIdentifiersAPIOutDTO>(
      this.addClientRoot(`application/${applicationNumber}/appeal`),
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
}
