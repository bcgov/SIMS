import { AxiosRequestConfig } from "axios";
import { AppConfigService } from "../../AppConfigService";
import HttpClient from "./HttpClient";

export default abstract class HttpBaseClient {
  protected apiClient = HttpClient;

  protected addAuthHeader(): AxiosRequestConfig {
    const token = AppConfigService.shared.authService?.token;
    if (token) {
      const Authorization = `Bearer ${token}`;
      return { headers: { Authorization } };
    }

    throw new Error("User is not authenticated!");
  }

  protected handleRequestError(e: any) {
    console.log(e);
  }
}
