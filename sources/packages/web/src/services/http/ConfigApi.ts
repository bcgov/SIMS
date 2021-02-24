import HttpBaseClient from "./common/HttpBaseClient";
import { GetConfig } from "../../types/contracts/ConfigContract";

export class ConfigApi extends HttpBaseClient {
  public async getConfig(): Promise<GetConfig> {
    try {
      const response = await this.apiClient.get("config");
      return response.data;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async getUserInfo(): Promise<any> {
    try {
      const response = await this.apiClient.get(
        "/user-info",
        this.addAuthHeader(),
      );
      return response.data;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }
}
