import {
  CreateApplicationDraftResult,
  SaveStudentApplicationDto,
  ApplicationWithProgramYearDto,
  ApplicationStatusToBeUpdatedDto,
  GetApplicationDataDto,
  GetApplicationBaseDTO,
  DataTableSortOrder,
  StudentApplicationFields,
  DEFAULT_PAGE_LIMIT,
  DEFAULT_PAGE_NUMBER,
  ApplicationIdentifiersDTO,
} from "@/types";
import { MORE_THAN_ONE_APPLICATION_DRAFT_ERROR } from "@/types/contracts/ApiProcessError";
import ApiClient from "../services/http/ApiClient";
import {
  ApplicationSummaryAPIOutDTO,
  PaginatedResultsAPIOutDTO,
} from "./http/dto";

export class ApplicationService {
  // Share Instance
  private static instance: ApplicationService;

  public static get shared(): ApplicationService {
    return this.instance || (this.instance = new this());
  }

  public async updateStudentApplicationStatus(
    applicationId: number,
    payload: ApplicationStatusToBeUpdatedDto,
  ): Promise<void> {
    await ApiClient.Application.updateStudentApplicationStatus(
      applicationId,
      payload,
    );
  }

  public async getApplicationData(
    applicationId: number,
  ): Promise<GetApplicationDataDto> {
    return ApiClient.Application.getApplicationData(applicationId);
  }

  public async createApplicationDraft(
    payload: SaveStudentApplicationDto,
  ): Promise<CreateApplicationDraftResult> {
    try {
      const applicationId = await ApiClient.Application.createApplicationDraft(
        payload,
      );
      return { draftAlreadyExists: false, draftId: applicationId };
    } catch (error) {
      if (
        error.response.data?.errorType === MORE_THAN_ONE_APPLICATION_DRAFT_ERROR
      ) {
        return { draftAlreadyExists: true };
      }
      throw error;
    }
  }

  public async saveApplicationDraft(
    applicationId: number,
    payload: SaveStudentApplicationDto,
  ): Promise<number> {
    return ApiClient.Application.saveApplicationDraft(applicationId, payload);
  }

  public async submitApplication(
    applicationId: number,
    payload: SaveStudentApplicationDto,
  ): Promise<void> {
    return ApiClient.Application.submitApplication(applicationId, payload);
  }

  public async getApplicationWithPY(
    applicationId: number,
    includeInActivePY?: boolean,
  ): Promise<ApplicationWithProgramYearDto> {
    return ApiClient.Application.getApplicationWithPY(
      applicationId,
      includeInActivePY,
    );
  }

  /**
   * Get application detail of given application
   * @param applicationId
   * @returns GetApplicationBaseDTO
   */
  async getApplicationDetail(
    applicationId: number,
  ): Promise<GetApplicationBaseDTO> {
    return ApiClient.Application.getApplicationDetails(applicationId);
  }

  /**
   * Get the list of application that belongs to a student on a summary view format.
   * @param page page number.
   * @param pageCount limit of the page.
   * @param sortField field to be sorted.
   * @param sortOrder order to be sorted.
   * @param studentId student id. Used only for for AEST.
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

  public async getApplicationForRequestChange(
    applicationNumber: string,
  ): Promise<ApplicationIdentifiersDTO> {
    return ApiClient.Application.getApplicationForRequestChange(
      applicationNumber,
    );
  }
}
