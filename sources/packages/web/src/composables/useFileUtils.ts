import { StudentService } from "@/services/StudentService";
import { StudentUploadFileDTO } from "@/types";

/**
 * File helper methods.
 */
export function useFileUtils() {
  /**
   * Used to download the document or file uploaded, which has the StudentUploadFileDTO structure
   * @param studentDocument
   */
  const downloadDocument = async (studentDocument: StudentUploadFileDTO) => {
    const fileURL = await StudentService.shared.downloadStudentFile(
      studentDocument.uniqueFileName,
    );
    const fileLink = document.createElement("a");
    fileLink.href = fileURL;
    fileLink.setAttribute("download", studentDocument.fileName);
    document.body.appendChild(fileLink);
    fileLink.click();
    // After download, remove the element
    fileLink.remove();
  };

  return {
    downloadDocument,
  };
}
