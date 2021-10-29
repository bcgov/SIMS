import { AuthService } from "@/services/AuthService";
import { AxiosRequestConfig } from "axios";
import HttpClient from "./HttpClient";
import { MINIMUM_TOKEN_VALIDITY } from "@/constants/system-constants";

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
  static renewTokenIfExpired() {
    if (AuthService.shared.keycloak?.isTokenExpired(MINIMUM_TOKEN_VALIDITY)) {
      AuthService.shared.keycloak?.updateToken(MINIMUM_TOKEN_VALIDITY);
    }
  }

  protected addAuthHeader(): AxiosRequestConfig {
    HttpBaseClient.renewTokenIfExpired();
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
