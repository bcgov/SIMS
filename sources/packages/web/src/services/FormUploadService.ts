import { AxiosRequestConfig } from "axios";
import ApiClient from "../services/http/ApiClient";

export default class FormUploadService {
  public async uploadFile(
    storage: string,
    file: any,
    fileName: string,
    dir: string,
    evt: any,
    url: string,
  ) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", fileName);
    formData.append("dir", dir);
    console.log(formData);
    const requestConfig: AxiosRequestConfig = { onUploadProgress: evt };
    const uploadResponse = await ApiClient.FileUpload.upload(
      url,
      formData,
      requestConfig,
    );
    return {
      storage: storage,
      name: fileName,
      url: "http://www.test.com",
      size: file.size,
      type: file.type,
    };
  }
}
