import { StudentUploadFileAPIOutDTO } from "@/services/http/dto/Student.dto";
import { ReportsFilterAPIInDTO } from "@/services/http/dto";
import { StudentService } from "@/services/StudentService";
import { ReportService } from "@/services/ReportService";
import { AxiosResponse } from "axios";

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
  const downloadStudentDocument = async (studentDocument: StudentDocument) => {
    const response = await StudentService.shared.downloadStudentFile(
      studentDocument.uniqueFileName,
    );
    downloadFileAsBlob(response);
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
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    // After download, remove the element
    link.remove();
  };

  return {
    downloadStudentDocument,
    downloadReports,
  };
}
