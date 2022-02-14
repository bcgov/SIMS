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
  static async renewTokenIfExpired() {
    await AuthService.shared.keycloak?.updateToken(MINIMUM_TOKEN_VALIDITY);
  }

  protected addAuthHeader(): AxiosRequestConfig {
    return HttpBaseClient.createAuthHeader(AuthService.shared.keycloak?.token);
  }

  protected handleRequestError(e: any) {
    console.log(e);
  }

  protected async getCall(url: string, authHeader?: any): Promise<any> {
    try {
      const response = await this.apiClient.get(
        url,
        authHeader ?? this.addAuthHeader(),
      );
      return response;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  protected async getCallTyped<T>(url: string, authHeader?: any): Promise<T> {
    try {
      const response = await this.apiClient.get(
        url,
        authHeader ?? this.addAuthHeader(),
      );
      return response.data as T;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  protected async postCall<T>(url: string, payload: T): Promise<void> {
    try {
      await this.apiClient.post(url, payload, this.addAuthHeader());
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  protected async patchCall<T>(url: string, payload: T): Promise<void> {
    try {
      await this.apiClient.patch(url, payload, this.addAuthHeader());
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  protected handleCustomError(error: any) {
    if (error.response) {
      this.handleRequestError(error.response.data?.message);
      throw error.response.data?.message;
    }
    this.handleRequestError(error);
    throw error;
  }
}
