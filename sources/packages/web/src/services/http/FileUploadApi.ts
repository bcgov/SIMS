import { FileCreateAPIOutDTO } from "@/services/http/dto";
import { AxiosRequestConfig, AxiosResponse } from "axios";
import HttpBaseClient from "./common/HttpBaseClient";

export class FileUploadApi extends HttpBaseClient {
  async upload<T = FileCreateAPIOutDTO>(
    relativeUrl: string,
    data: FormData,
    config: AxiosRequestConfig,
    skipGlobalErrorHandler = false,
  ): Promise<T> {
    try {
      const mergedConfig = { ...this.addAuthHeader(), ...config };
      return this.postCall(this.addClientRoot(relativeUrl), data, mergedConfig);
    } catch (error) {
      if (!skipGlobalErrorHandler) {
        this.handleRequestError(error);
      }
      throw error;
    }
  }

  async download(relativeUrl: string): Promise<AxiosResponse<any>> {
    return this.downloadFile(relativeUrl);
  }
}
