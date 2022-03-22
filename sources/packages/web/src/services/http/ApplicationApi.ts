import { addPaginationOptions, addSortOptions } from "@/helpers";
import {
  SaveStudentApplicationDto,
  ApplicationWithProgramYearDto,
  ApplicationStatusToBeUpdatedDto,
  GetApplicationDataDto,
  GetApplicationBaseDTO,
  StudentApplicationAndCount,
  NoticeOfAssessmentDTO,
  DEFAULT_PAGE_NUMBER,
  DEFAULT_PAGE_LIMIT,
  StudentApplicationFields,
  DataTableSortOrder,
  ApplicationPrimaryDTO,
} from "@/types";
import HttpBaseClient from "./common/HttpBaseClient";

export class ApplicationApi extends HttpBaseClient {
  public async getApplicationData(applicationId: number): Promise<any> {
    try {
      const response = await this.apiClient.get(
        this.addClientRoot(`application/${applicationId}`),
        this.addAuthHeader(),
      );
      return response.data as GetApplicationDataDto;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  /**
   * Retrieve the Notice of Assessment (NOA) for a particular application.
   */
  public async getNOA(applicationId: number): Promise<NoticeOfAssessmentDTO> {
    try {
      const response = await this.apiClient.get(
        this.addClientRoot(`application/${applicationId}/assessment`),
        this.addAuthHeader(),
      );
      return response.data;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async confirmAssessment(applicationId: number): Promise<void> {
    try {
      await this.apiClient.patch(
        this.addClientRoot(`application/${applicationId}/confirm-assessment`),
        {},
        this.addAuthHeader(),
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async updateStudentApplicationStatus(
    applicationId: number,
    payload: ApplicationStatusToBeUpdatedDto,
  ): Promise<void> {
    try {
      await this.apiClient.patch(
        this.addClientRoot(`application/${applicationId}/status`),
        payload,
        this.addAuthHeader(),
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async createApplicationDraft(
    payload: SaveStudentApplicationDto,
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

  public async saveApplicationDraft(
    applicationId: number,
    payload: SaveStudentApplicationDto,
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

  public async submitApplication(
    applicationId: number,
    payload: SaveStudentApplicationDto,
  ): Promise<void> {
    // this.apiClient.patch is used to catch the errors
    // this errors are displayed in client side in toast message
    await this.apiClient
      .patch(
        this.addClientRoot(`application/${applicationId}/submit`),
        payload,
        this.addAuthHeader(),
      )
      .catch(error => {
        if (error.response) {
          this.handleRequestError(error.response.data?.message);
          throw error.response.data?.message;
        }
      });
  }

  public async getApplicationWithPY(
    applicationId: number,
    includeInActivePY?: boolean,
  ): Promise<ApplicationWithProgramYearDto> {
    try {
      let url = this.addClientRoot(`application/${applicationId}/program-year`);
      if (includeInActivePY) {
        url = `${url}?includeInActivePY=${includeInActivePY}`;
      }
      const response = await this.getCall(url);
      return response.data as ApplicationWithProgramYearDto;
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
  public async getApplicationDetails(
    applicationId: number,
  ): Promise<GetApplicationBaseDTO> {
    const response = await this.getCall(
      this.addClientRoot(`application/${applicationId}`),
    );
    return response.data as GetApplicationBaseDTO;
  }

  /**
   * API Client to get student applications.
   * @param page, page number if nothing is passed then
   * DEFAULT_PAGE_NUMBER is taken
   * @param pageLimit, limit of the page if nothing is
   * passed then DEFAULT_PAGE_LIMIT is taken
   * @param sortField, field to be sorted
   * @param sortOrder, order to be sorted
   * @returns StudentApplicationAndCount
   */
  public async getAllApplicationAndCountForStudent(
    page = DEFAULT_PAGE_NUMBER,
    pageCount = DEFAULT_PAGE_LIMIT,
    sortField?: StudentApplicationFields,
    sortOrder?: DataTableSortOrder,
  ): Promise<StudentApplicationAndCount> {
    let url = "students/application-summary";
    // Adding pagination params. There is always a default page and pageCount for paginated APIs.
    url = addPaginationOptions(url, page, pageCount, "?");
    //Adding Sort params. There is always a default sortField and sortOrder for COE.
    url = addSortOptions(url, sortField, sortOrder);
    return this.getCallTyped<StudentApplicationAndCount>(url);
  }

  /**
   * API Client to get student applications for AEST.
   * @param studentId student id
   * @param page, page number if nothing is passed then
   * DEFAULT_PAGE_NUMBER is taken
   * @param pageCount, limit of the page if nothing is
   * passed then DEFAULT_PAGE_LIMIT is taken
   * @param sortField, field to be sorted
   * @param sortOrder, order to be sorted
   * @returns StudentApplicationAndCount
   */
  public async getAllApplicationAndCountForAEST(
    studentId: number,
    page = DEFAULT_PAGE_NUMBER,
    pageCount = DEFAULT_PAGE_LIMIT,
    sortField?: StudentApplicationFields,
    sortOrder?: DataTableSortOrder,
  ): Promise<StudentApplicationAndCount> {
    let url = `application/student/${studentId}`;
    // Adding pagination params. There is always a default page and pageCount for paginated APIs.
    url = addPaginationOptions(url, page, pageCount, "?");
    //Adding Sort params. There is always a default sortField and sortOrder for COE.
    url = addSortOptions(url, sortField, sortOrder);
    return this.getCallTyped<StudentApplicationAndCount>(
      this.addClientRoot(url),
    );
  }

  public async getApplicationForRequestChange(
    applicationNumber: string,
  ): Promise<ApplicationPrimaryDTO> {
    return this.getCallTyped<ApplicationPrimaryDTO>(
      this.addClientRoot(`application/${applicationNumber}/change`),
    );
  }
}
