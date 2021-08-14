import ApiClient from "../services/http/ApiClient";
import {
  ApplicationStatusToBeUpdatedDto,
  GetApplicationDataDto,
} from "@/types/contracts/students/ApplicationContract";

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
  ) {
    return ApiClient.Application.updateStudentApplicationStatus(
      applicationId,
      payload,
    );
  }
  public async getApplicationData(
    applicationId: number,
  ): Promise<GetApplicationDataDto> {
    return ApiClient.Application.getApplicationData(applicationId);
  }
}
