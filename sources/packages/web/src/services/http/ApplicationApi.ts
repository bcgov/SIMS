import HttpBaseClient from "./common/HttpBaseClient";

export class ApplicationApi extends HttpBaseClient {
  public async createApplication(data: any): Promise<any> {
    try {
      return await this.apiClient.post(
        "application",
        { data },
        this.addAuthHeader(),
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async getApplicationData(applicationId: any): Promise<any> {
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
}
