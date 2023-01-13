import { FileCreateAPIOutDTO } from "@/services/http/dto";
import { AxiosRequestConfig, AxiosResponse } from "axios";
import HttpBaseClient from "./common/HttpBaseClient";

export class FileUploadApi extends HttpBaseClient {
  async upload<T = FileCreateAPIOutDTO>(
    relativeUrl: string,
    data: FormData,
    config: AxiosRequestConfig,
  ): Promise<T> {
    const mergedConfig = { ...this.addAuthHeader(), ...config };
    return this.postCall(this.addClientRoot(relativeUrl), data, mergedConfig);
  }

  async download(relativeUrl: string): Promise<AxiosResponse<any>> {
    return this.downloadFile(relativeUrl);
  }
}
