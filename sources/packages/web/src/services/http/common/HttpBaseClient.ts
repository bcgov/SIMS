import { AuthService } from "@/services/AuthService";
import { AxiosRequestConfig } from "axios";
import HttpClient from "./HttpClient";

export default abstract class HttpBaseClient {
  protected apiClient = HttpClient;

  static createAuthHeader(token?: string) {
    if (token) {
      const authorization = `Bearer ${token}`;
      return { headers: { Authorization: authorization } };
    } else {
      throw new Error("User is not authenticated!");
    }
  }

  protected addAuthHeader(): AxiosRequestConfig {
    return HttpBaseClient.createAuthHeader(AuthService.shared.keycloak?.token);
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
