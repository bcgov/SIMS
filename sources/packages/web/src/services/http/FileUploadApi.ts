import { FileCreateAPIOutDTO } from "@/services/http/dto";
import { AxiosRequestConfig, AxiosResponse } from "axios";
import HttpBaseClient from "./common/HttpBaseClient";

export class FileUploadApi extends HttpBaseClient {
  public async upload(
    relativeUrl: string,
    data: FormData,
    config: AxiosRequestConfig,
  ): Promise<FileCreateAPIOutDTO> {
    try {
      const mergedConfig = { ...this.addAuthHeader(), ...config };
      const response = await this.apiClient.post(
        this.addClientRoot(relativeUrl),
        data,
        mergedConfig,
      );
      return response.data;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async download(relativeUrl: string): Promise<AxiosResponse<any>> {
    return this.downloadFile(relativeUrl);
  }
}
