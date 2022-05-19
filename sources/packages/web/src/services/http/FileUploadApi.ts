import { FileCreateAPIOutDTO } from "@/services/http/dto";
import { AxiosRequestConfig } from "axios";
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

  public async download(relativeUrl: string): Promise<Blob> {
    try {
      const requestConfig: AxiosRequestConfig = {
        ...this.addAuthHeader(),
        responseType: "blob",
      };
      const response = await this.apiClient.get(
        this.addClientRoot(relativeUrl),
        requestConfig,
      );
      return new Blob([response.data]);
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }
}
