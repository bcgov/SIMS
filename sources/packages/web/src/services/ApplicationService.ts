import {
  CreateApplicationDraftResult,
  SaveStudentApplicationDto,
  ApplicationWithProgramYearDto,
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
} from "@/services/http/dto";
import { InProgressApplicationDetailsAPIOutDTO } from "@/services/http/dto/Application.dto";

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
  ): Promise<GetApplicationDataDto> {
    return ApiClient.Application.getApplicationData(applicationId);
  }

  async createApplicationDraft(
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

  async saveApplicationDraft(
    applicationId: number,
    payload: SaveStudentApplicationDto,
  ): Promise<number> {
    return ApiClient.Application.saveApplicationDraft(applicationId, payload);
  }

  async submitApplication(
    applicationId: number,
    payload: SaveStudentApplicationDto,
  ): Promise<void> {
    return ApiClient.Application.submitApplication(applicationId, payload);
  }

  async getApplicationWithPY(
    applicationId: number,
    isIncludeInActiveProgramYear?: boolean,
  ): Promise<ApplicationWithProgramYearDto> {
    return ApiClient.Application.getApplicationWithPY(
      applicationId,
      isIncludeInActiveProgramYear,
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
  ): Promise<ApplicationIdentifiersDTO> {
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
}
