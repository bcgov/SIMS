import { FormUploadFileInfo } from "@/types";
import { AxiosRequestConfig } from "axios";
import ApiClient from "../services/http/ApiClient";

/**
 * Implements the methods and signatures that are necessaries
 * to override the Form.IO upload service while creating a
 * new form using the Formio.createForm method.
 */
export default class FormUploadService {
  public async uploadFile(
    storage: string,
    file: any,
    fileName: string,
    dir: string,
    evt: any,
    url: string,
  ): Promise<FormUploadFileInfo> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("uniqueFileName", fileName);
    formData.append("group", dir);
    // Configure the request to provide upload progress status.
    const requestConfig: AxiosRequestConfig = { onUploadProgress: evt };
    const uploadResponse = await ApiClient.FileUpload.upload(
      url,
      formData,
      requestConfig,
    );

    return {
      storage: storage,
      originalName: uploadResponse.fileName,
      name: uploadResponse.uniqueFileName,
      url: uploadResponse.url,
      size: uploadResponse.size,
      type: uploadResponse.mimetype,
    };
  }

  public async downloadFile(fileInfo: FormUploadFileInfo) {
    const fileContent = await ApiClient.FileUpload.download(fileInfo.url);
    // Change the storage type to base64 to allow the file to be "downloaded"
    // using the bytes retrieved instead of juts opening an url.
    // if we use directly the url we will not have the oportunity to authorize
    // the file download.
    return {
      storage: "base64",
      url: fileContent,
      originalName: fileInfo.originalName,
      name: fileInfo.name,
      type: fileInfo.type,
    };
  }
}
