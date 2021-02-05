import { AxiosRequestConfig } from "axios";
import { AppConfigService } from "../../AppConfigService";
import HttpClient from "./HttpClient";

export default abstract class HttpBaseClient {
  protected apiClient = HttpClient;

  protected addAuthHeader(): AxiosRequestConfig {
    const token = AppConfigService.shared.authService?.token;
    console.dir(`token is ${token}`)
    if (token) {
      const authorization = `Bearer ${token}`;
      return { headers: { Authorization: authorization } };
    }

    throw new Error("User is not authenticated!");
  }

  protected handleRequestError(e: any) {
    console.log(e);
  }
}
