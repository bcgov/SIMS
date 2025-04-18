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
    const linkURL = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    const fileName =
      response.headers["content-disposition"].split("filename=")[1];
    link.href = linkURL;
    link.setAttribute("download", decodeURIComponent(fileName));
    document.body.appendChild(link);
    link.click();
    // After download, remove the element
    link.remove();
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
    downloadReports,
    handleFileScanProcessError,
    downloadFileAsBlob,
  };
}
