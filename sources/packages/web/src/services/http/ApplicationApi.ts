import { SaveStudentApplicationDto } from "@/types";
import HttpBaseClient from "./common/HttpBaseClient";

export class ApplicationApi extends HttpBaseClient {
  public async getApplicationData(applicationId: number): Promise<any> {
    try {
      const response = await this.apiClient.get(
        `application/${applicationId}/data`,
        this.addAuthHeader(),
      );
      return response.data.data;
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

  public async createApplicationDraft(
    payload: SaveStudentApplicationDto,
  ): Promise<number> {
    try {
      const response = await this.apiClient.post(
        "application/draft",
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
        `application/${applicationId}/draft`,
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
  ): Promise<any> {
    try {
      return await this.apiClient.patch(
        `application/${applicationId}`,
        payload,
        this.addAuthHeader(),
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }
}
