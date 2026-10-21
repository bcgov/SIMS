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

  public async downloadFile(fileInfo: FormUploadFileInfo): Promise<void> {
    try {
      const fileContent = await ApiClient.FileUpload.download(fileInfo.url);
      // The file is opened here instead of returning a url for Form.io to open,
      // so the blob url can be revoked once the viewer tab is closed. Returning
      // nothing prevents Form.io from opening a second tab.
      // Note: Form.io image file components (image: true) expect a url to be
      // returned to render thumbnails and are not supported.
      useFileUtils().viewBlob(fileContent.data);
    } catch (error: unknown) {
      if (!useFileUtils().handleFileScanProcessError(error)) {
        throw new Error(
          "There was an unexpected error while viewing the file.",
        );
      }
    }
  }
}
