import { AxiosRequestConfig } from "axios";
import HttpBaseClient from "./common/HttpBaseClient";

export class FileUploadApi extends HttpBaseClient {
  public async upload(
    relativeUrl: string,
    data: FormData,
    config: AxiosRequestConfig,
  ): Promise<any> {
    try {
      const mergedConfig = { ...this.addAuthHeader(), ...config };
      return await this.apiClient.post(relativeUrl, data, mergedConfig);
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }
}
