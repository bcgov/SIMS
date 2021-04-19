import { AxiosRequestConfig } from "axios";
import { AppConfigService } from "../../AppConfigService";
import HttpClient from "./HttpClient";

export default abstract class HttpBaseClient {
  protected apiClient = HttpClient;

  static createAuthHeader(token: any) {
    if (token) {
      const authorization = `Bearer ${token}`;
      return { headers: { Authorization: authorization } };
    } else {
      throw new Error("User is not authenticated!");
    }
  }
  protected addAuthHeader(): AxiosRequestConfig {
    const token = AppConfigService.shared.authService?.token;
    return HttpBaseClient.createAuthHeader(token);
  }

  protected handleRequestError(e: any) {
    console.log(e);
  }

  protected async getCall(url: string): Promise<any> {
    try {
      const response = await this.apiClient.get(url, this.addAuthHeader());
      return response;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }
}
