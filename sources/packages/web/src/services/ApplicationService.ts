import {
  CreateApplicationDraftResult,
  SaveStudentApplicationDto,
  ProgramYearOfApplicationDto,
  ApplicationStatusToBeUpdatedDto,
  GetApplicationDataDto,
  GetApplicationBaseDTO,
  NoticeOfAssessmentDTO,
  DataTableSortOrder,
  StudentApplicationFields,
  DEFAULT_PAGE_LIMIT,
  DEFAULT_PAGE_NUMBER,
  FieldSortOrder,
  StudentApplicationAndCount,
} from "@/types";
import { MORE_THAN_ONE_APPLICATION_DRAFT_ERROR } from "@/types/contracts/ApiProcessError";
import ApiClient from "../services/http/ApiClient";
export class ApplicationService {
  // Share Instance
  private static instance: ApplicationService;

  public static get shared(): ApplicationService {
    return this.instance || (this.instance = new this());
  }

  public async getNOA(applicationId: number): Promise<NoticeOfAssessmentDTO> {
    return ApiClient.Application.getNOA(applicationId);
  }

  public async confirmAssessment(applicationId: number): Promise<void> {
    return ApiClient.Application.confirmAssessment(applicationId);
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

  public async getProgramYearOfApplication(
    applicationId: number,
    includeInActivePY?: boolean,
  ): Promise<ProgramYearOfApplicationDto> {
    return ApiClient.Application.getProgramYearOfApplication(
      applicationId,
      includeInActivePY,
    );
  }

  /**
   * Get application detail of given application
   * @param applicationId
   * @param userId
   * @returns GetApplicationBaseDTO
   */
  async getApplicationDetail(
    applicationId: number,
    studentId: number,
  ): Promise<GetApplicationBaseDTO> {
    return ApiClient.Application.getApplicationDetails(
      applicationId,
      studentId,
    );
  }

  /**
   * Get all the applications for a student
   * @param studentId student id
   * @param page, page number if nothing is passed then
   * DEFAULT_PAGE_NUMBER is taken
   * @param pageLimit, limit of the page if nothing is
   * passed then DEFAULT_PAGE_LIMIT is taken
   * @param sortField, field to be sorted
   * @param sortOrder, order to be sorted
   * @returns StudentApplicationAndCount
   */
  async getAllApplicationAndCount(
    studentId: number,
    page = DEFAULT_PAGE_NUMBER,
    pageCount = DEFAULT_PAGE_LIMIT,
    sortField?: StudentApplicationFields,
    sortOrder?: DataTableSortOrder,
  ): Promise<StudentApplicationAndCount> {
    let URL = `application/student/${studentId}/aest?page=${page}&pageLimit=${pageCount}`;
    if (sortField && sortOrder) {
      const sortDBOrder =
        sortOrder === DataTableSortOrder.DESC
          ? FieldSortOrder.DESC
          : FieldSortOrder.ASC;
      URL = `${URL}&sortField=${sortField}&sortOrder=${sortDBOrder}`;
    }
    return ApiClient.Application.getAllApplicationAndCount(URL);
  }
}
