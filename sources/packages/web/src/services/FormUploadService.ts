import { FormUploadFileInfo } from "@/types";
import { AxiosRequestConfig } from "axios";
import ApiClient from "../services/http/ApiClient";
import { useFileUtils } from "@/composables";

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
    try {
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
    } catch {
      throw new Error(
        "There was an unexpected error while uploading the file.",
      );
    }
  }

  public async downloadFile(fileInfo: FormUploadFileInfo) {
    try {
      const fileContent = await ApiClient.FileUpload.download(fileInfo.url);
      // Form.io only forces a download (via downloadjs) when storage is
      // "base64" or "indexeddb". Any other storage value makes it open the
      // url with window.open, so a blob url is used here to open the file
      // in a new tab instead of forcing a download.
      const blobUrl = URL.createObjectURL(fileContent.data);
      return {
        storage: "url",
        url: blobUrl,
        originalName: fileInfo.originalName,
        name: fileInfo.name,
        type: fileInfo.type,
        size: fileContent.data.size,
      };
    } catch (error: unknown) {
      if (!useFileUtils().handleFileScanProcessError(error)) {
        throw new Error(
          "There was an unexpected error while viewing the file.",
        );
      }
    }
  }
}
