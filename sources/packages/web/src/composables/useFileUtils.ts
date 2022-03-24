import { StudentService } from "@/services/StudentService";
import { StudentUploadFileDto } from "@/types";

/**
 * File helper methods.
 */
export function useFileUtils() {
  /**
   * Used to download the document or file uploaded, which has the StudentUploadFileDto structure
   * @param studentDocument
   */
  const downloadDocument = async (studentDocument: StudentUploadFileDto) => {
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
