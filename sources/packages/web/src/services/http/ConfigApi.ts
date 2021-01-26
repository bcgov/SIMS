import HttpBaseClient from "./common/HttpBaseClient";

export interface GetConfig {
  auth: AuthConfig;
}

export interface AuthConfig {
  url: string;
  realm: string;
  clientId: string;
}

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
}
