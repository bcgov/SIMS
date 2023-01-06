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
} from "./dto";

export class ApplicationApi extends HttpBaseClient {
  async getApplicationData(
    applicationId: number,
  ): Promise<ApplicationDataAPIOutDTO> {
    try {
      const response = await this.apiClient.get(
        this.addClientRoot(`application/${applicationId}`),
        this.addAuthHeader(),
      );
      return response.data as ApplicationDataAPIOutDTO;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  async cancelStudentApplication(applicationId: number): Promise<void> {
    await this.patchCall(
      this.addClientRoot(`application/${applicationId}/cancel`),
      null,
    );
  }

  async createApplicationDraft(
    payload: SaveApplicationAPIInDTO,
  ): Promise<number> {
    try {
      const response = await this.apiClient.post(
        this.addClientRoot("application/draft"),
        payload,
        this.addAuthHeader(),
      );
      return +response.data;
    } catch (error) {
      if (!error.response.data?.errorType) {
        // If it is an not expected error,
        // handle it the default way.
        this.handleRequestError(error);
      }

      throw error;
    }
  }

  async saveApplicationDraft(
    applicationId: number,
    payload: SaveApplicationAPIInDTO,
  ): Promise<number> {
    try {
      const response = await this.apiClient.patch(
        this.addClientRoot(`application/${applicationId}/draft`),
        payload,
        this.addAuthHeader(),
      );
      return +response.data;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  async submitApplication(
    applicationId: number,
    payload: SaveApplicationAPIInDTO,
  ): Promise<void> {
    try {
      await this.patchCall(
        this.addClientRoot(`application/${applicationId}/submit`),
        payload,
      );
    } catch (error: unknown) {
      this.handleAPICustomError(error);
    }
  }

  async getApplicationWithPY(
    applicationId: number,
    isIncludeInActiveProgramYear?: boolean,
  ): Promise<ApplicationWithProgramYearAPIOutDTO> {
    try {
      let url = this.addClientRoot(`application/${applicationId}/program-year`);
      if (isIncludeInActiveProgramYear) {
        url = `${url}?isIncludeInActiveProgramYear=${isIncludeInActiveProgramYear}`;
      }
      const response = await this.getCall(url);
      return response.data as ApplicationWithProgramYearAPIOutDTO;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  /**
   * API Client for application detail.
   * @param applicationId
   * @returns
   */
  async getApplicationDetails(
    applicationId: number,
  ): Promise<ApplicationBaseAPIOutDTO> {
    const response = await this.getCall(
      this.addClientRoot(`application/${applicationId}`),
    );
    return response.data as ApplicationBaseAPIOutDTO;
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
    return this.getCallTyped<
      PaginatedResultsAPIOutDTO<ApplicationSummaryAPIOutDTO>
    >(this.addClientRoot(url));
  }

  async getApplicationForRequestChange(
    applicationNumber: string,
  ): Promise<ApplicationIdentifiersAPIOutDTO> {
    return this.getCallTyped<ApplicationIdentifiersAPIOutDTO>(
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
    return this.getCallTyped<InProgressApplicationDetailsAPIOutDTO>(
      this.addClientRoot(`application/${applicationId}/in-progress`),
    );
  }
}
