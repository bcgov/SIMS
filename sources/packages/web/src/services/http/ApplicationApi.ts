import HttpBaseClient from "./common/HttpBaseClient";
import { LocationsApplicationDTO } from "@/types/contracts/institution/ApplicationsDto";

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

  public async getPIRSummary(
    locationId: number,
  ): Promise<LocationsApplicationDTO[]> {
    try {
      const response = await this.apiClient.get(
        `institution/location/${locationId}/pir-summary`,
        this.addAuthHeader(),
      );
      return response.data;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }
}
