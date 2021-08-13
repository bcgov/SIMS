import { SaveStudentApplicationDto } from "@/types";
import HttpBaseClient from "./common/HttpBaseClient";

export class ApplicationApi extends HttpBaseClient {
  public async createApplication(
    payload: SaveStudentApplicationDto,
  ): Promise<any> {
    try {
      return await this.apiClient.post(
        "application",
        payload,
        this.addAuthHeader(),
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

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
    const response = await this.apiClient.post(
      "application/draft",
      payload,
      this.addAuthHeader(),
    );
    return +response.data;
  }

  public async saveApplicationDraft(
    applicationId: number,
    payload: SaveStudentApplicationDto,
  ): Promise<number> {
    const response = await this.apiClient.patch(
      `application/${applicationId}/draft`,
      payload,
      this.addAuthHeader(),
    );
    return +response.data;
  }
}
