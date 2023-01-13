import { addPaginationOptions, addSortOptions } from "@/helpers";
import {
  DEFAULT_PAGE_NUMBER,
  DEFAULT_PAGE_LIMIT,
  StudentApplicationFields,
  DataTableSortOrder,
  ClientIdType,
} from "@/types";
import { AuthService } from "../AuthService";
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
} from "@/services/http/dto";

export class ApplicationApi extends HttpBaseClient {
  async getApplicationData(
    applicationId: number,
  ): Promise<ApplicationDataAPIOutDTO> {
    return this.getCall<ApplicationDataAPIOutDTO>(
      this.addClientRoot(`application/${applicationId}`),
      this.addAuthHeader(),
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
   * @param applicationId
   * @returns
   */
  async getApplicationDetails(
    applicationId: number,
  ): Promise<ApplicationBaseAPIOutDTO> {
    return this.getCall<ApplicationBaseAPIOutDTO>(
      this.addClientRoot(`application/${applicationId}`),
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
    let url =
      AuthService.shared.authClientType === ClientIdType.AEST
        ? `student/${studentId}/application-summary`
        : `student/application-summary`;
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
}
