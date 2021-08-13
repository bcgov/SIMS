import { SaveStudentApplicationDto } from "@/types";
import { ONLY_ONE_DRAFT_ERROR } from "@/types/contracts/ApiProcessError";
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

  public async createApplicationDraft(
    payload: SaveStudentApplicationDto,
  ): Promise<{
    draftAlreadyExists: boolean;
    draftId?: number;
  }> {
    try {
      const appliationId = await ApiClient.Application.createApplicationDraft(
        payload,
      );
      return { draftAlreadyExists: false, draftId: appliationId };
    } catch (error) {
      if (error.response.data?.errorType === ONLY_ONE_DRAFT_ERROR) {
        return { draftAlreadyExists: true };
      }
      throw error;
    }
  }
}
