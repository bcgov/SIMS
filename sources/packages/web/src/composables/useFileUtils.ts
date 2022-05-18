import { StudentService } from "@/services/StudentService";
import { StudentUploadFileAPIOutDTO } from "@/types";

/**
 * File helper methods.
 */
export function useFileUtils() {
  /**
   * Used to download the document or file uploaded.
   * @param studentDocument
   */
  const downloadDocument = async (
    studentDocument: StudentUploadFileAPIOutDTO,
  ) => {
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
