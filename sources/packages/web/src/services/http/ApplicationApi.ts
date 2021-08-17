import HttpBaseClient from "./common/HttpBaseClient";
import {
  ApplicationStatusToBeUpdatedDto,
  GetApplicationDataDto,
} from "@/types/contracts/students/ApplicationContract";

export class ApplicationApi extends HttpBaseClient {
  public async createApplication(data: any): Promise<any> {
    try {
      return await this.apiClient.post(
        "application",
        data,
        this.addAuthHeader(),
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async getApplicationData(
    applicationId: number,
  ): Promise<GetApplicationDataDto> {
    try {
      const response = await this.apiClient.get(
        `application/${applicationId}`,
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
  public async getNOA(applicationId: number): Promise<any> {
    try {
      const response = await this.apiClient.get(
        `application/${applicationId}/assessment`,
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
        `application/${applicationId}/confirm-assessment`,
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
        `application/${applicationId}/status`,
        payload,
        this.addAuthHeader(),
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }
}
