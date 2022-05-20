import { AuthService } from "@/services/AuthService";
import { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import HttpClient from "./HttpClient";
import { MINIMUM_TOKEN_VALIDITY } from "@/constants/system-constants";
import { ApiProcessError, ClientIdType, ClientTypeBaseRoute } from "@/types";

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

  /**
   * Http call to download a file as response from API.
   ** When payload is passed, the file is downloaded on post call
   ** otherwise it is downloaded as get call.
   * @param url url of the API.
   * @param payload payload passed for post call.
   */
  protected async downloadFile<T>(url: string, payload?: T): Promise<void> {
    try {
      const requestConfig: AxiosRequestConfig = {
        ...this.addAuthHeader(),
        responseType: "blob",
      };
      let response;
      if (payload) {
        response = await this.apiClient.post(
          this.addClientRoot(url),
          payload,
          requestConfig,
        );
      } else {
        response = await this.apiClient.get(
          this.addClientRoot(url),
          requestConfig,
        );
      }
      this.downloadAsBlob(response);
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

  /**
   * Inspects the error to check if there is an ApiProcessError
   * to be handled, if yes, throw the ApiProcessError instead
   * of the AxiosError.
   * @param error error to be inspect.
   */
  protected handleAPICustomError(error: unknown) {
    const axiosError = error as AxiosError;
    if (axiosError.isAxiosError && axiosError.response?.data) {
      throw new ApiProcessError(
        axiosError.response.data.message,
        axiosError.response.data.errorType,
      );
    }
    throw error;
  }

  // TODO: Once all url's are updated, then this
  // function can be a private function and called
  // by getCallTyped or patch or post function
  public addClientRoot(url: string) {
    switch (AuthService.shared.authClientType) {
      case ClientIdType.AEST:
        return `${ClientTypeBaseRoute.AEST}/${url}`;
      case ClientIdType.Institution:
        return `${ClientTypeBaseRoute.Institution}/${url}`;
      case ClientIdType.Student:
        return `${ClientTypeBaseRoute.Student}/${url}`;
      case ClientIdType.SupportingUsers:
        return `${ClientTypeBaseRoute.SupportingUser}/${url}`;
      default:
        return url;
    }
  }

  private downloadAsBlob(response: AxiosResponse<any>) {
    const linkURL = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    const fileName =
      response.headers["content-disposition"].split("filename=")[1];
    link.href = linkURL;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
  }
}
