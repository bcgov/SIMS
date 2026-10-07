import { ReportsFilterAPIInDTO } from "@/services/http/dto";
import { StudentService } from "@/services/StudentService";
import { ReportService } from "@/services/ReportService";
import { AxiosResponse } from "axios";
import { useSnackBar } from "@/composables/useSnackBar";
import { FILE_HAS_NOT_BEEN_SCANNED_YET, VIRUS_DETECTED } from "@/constants";
import { ApiProcessError } from "@/types";

interface StudentDocument {
  uniqueFileName: string;
}
/**
 * File helper methods.
 */
export function useFileUtils() {
  /**
   * Used to download the document or file uploaded.
   * @param studentDocument
   */
  const downloadStudentDocument = async (
    studentDocument: StudentDocument,
  ): Promise<void> => {
    try {
      const response = await StudentService.shared.downloadStudentFile(
        studentDocument.uniqueFileName,
      );
      downloadFileAsBlob(response);
    } catch (error: unknown) {
      if (!useFileUtils().handleFileScanProcessError(error)) {
        throw new Error(
          "There was an unexpected error while downloading the file.",
        );
      }
    }
  };

  /**
   * Opens the document or file uploaded in a new browser tab instead of downloading it.
   * @param studentDocument student document to be viewed.
   */
  const viewStudentDocument = async (
    studentDocument: StudentDocument,
  ): Promise<void> => {
    try {
      const response = await StudentService.shared.downloadStudentFile(
        studentDocument.uniqueFileName,
      );
      viewFileAsBlob(response);
    } catch (error: unknown) {
      if (!useFileUtils().handleFileScanProcessError(error)) {
        throw new Error(
          "There was an unexpected error while viewing the file.",
        );
      }
    }
  };

  /**
   * Download reports as file through API call.
   * @param filterData filter data sent as payload to API.
   */
  const downloadReports = async (filterData: ReportsFilterAPIInDTO) => {
    const response = await ReportService.shared.exportReport(filterData);
    downloadFileAsBlob(response);
  };

  /**
   * Download file as blob using Axios http response.
   * @param response axios response object from http response.
   */
  const downloadFileAsBlob = (response: AxiosResponse<any>) => {
    const blob = new Blob([response.data]);
    const fileName =
      response.headers["content-disposition"].split("filename=")[1];
    downloadFile(blob, fileName);
  };

  /**
   * Opens a file as blob in a new browser tab using Axios http response.
   * @param response axios response object from http response.
   */
  const viewFileAsBlob = (response: AxiosResponse<any>): void => {
    const blob = new Blob([response.data], {
      type: response.headers["content-type"] as string | undefined,
    });

    const url = URL.createObjectURL(blob);
    const newTab = window.open(url, "_blank");
    if (!newTab) {
      // Tab blocked (e.g. pop-up blocker), release the url immediately.
      URL.revokeObjectURL(url);
      useSnackBar().warn(
        "The file could not be opened. Please allow pop-ups for this site.",
      );
      return;
    }
    // Prevent the opened content from accessing the application window.
    newTab.opener = null;
  };

  /**
   * Generates a JSON file from the provided content and triggers a download.
   * @param content content to be included in the JSON file.
   * @param fileName name of the file to be downloaded.
   */
  const generateJSONFileFromContent = (
    content: string,
    fileName: string,
  ): void => {
    const blob = new Blob([content], {
      type: "application/json;charset=utf-8;",
    });
    downloadFile(blob, fileName);
  };

  /**
   * Downloads a file using a Blob and a specified file name.
   * @param blob object representing the file data.
   * @param fileName name of the file to be downloaded.
   */
  const downloadFile = (blob: Blob, fileName: string): void => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    link.remove();
    URL.revokeObjectURL(url);
  };

  /**
   * Handles the file api process errors that may be thrown.
   * A warn message is displayed to the user.
   * @param error error to handled.
   * @returns true in case error is an expected API process error.
   */
  const handleFileScanProcessError = (error: unknown): boolean => {
    if (
      error instanceof ApiProcessError &&
      (error.errorType === FILE_HAS_NOT_BEEN_SCANNED_YET ||
        error.errorType === VIRUS_DETECTED)
    ) {
      const snackBar = useSnackBar();
      snackBar.warn(error.message);
      return true;
    }
    return false;
  };

  return {
    downloadStudentDocument,
    viewStudentDocument,
    downloadReports,
    handleFileScanProcessError,
    downloadFileAsBlob,
    generateJSONFileFromContent,
  };
}
