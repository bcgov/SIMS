import {
  CreateApplicationDraftResult,
  SaveStudentApplicationDto,
  ProgramYearOfApplicationDto,
  ApplicationStatusToBeUpdatedDto,
  GetApplicationDataDto,
} from "@/types";
import { MORE_THAN_ONE_APPLICATION_DRAFT_ERROR } from "@/types/contracts/ApiProcessError";
import ApiClient from "../services/http/ApiClient";
export class ApplicationService {
  // Share Instance
  private static instance: ApplicationService;

  public static get shared(): ApplicationService {
    return this.instance || (this.instance = new this());
  }

  public async getNOA(applicationId: number): Promise<any> {
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

  public async hasDraftApplication(): Promise<boolean> {
    return ApiClient.Application.hasDraftApplication();
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
  ): Promise<ProgramYearOfApplicationDto> {
    return ApiClient.Application.getProgramYearOfApplication(applicationId);
  }
}
