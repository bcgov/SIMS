import { Injectable } from "@nestjs/common";
import { StudentFileService } from "../../services";
import { StudentUploadFileDTO } from "./models/student.dto";

/**
 * Service/Provider for Student controller to wrap the common methods.
 */
@Injectable()
export class StudentControllerService {
  constructor(private readonly fileService: StudentFileService) {}

  /**
   * This method returns all student documents uploaded
   * by student using the studentId.
   * @param studentId
   * @returns student files as StudentUploadFileDTO.
   */
  async getStudentFiles(studentId: number): Promise<StudentUploadFileDTO[]> {
    const studentDocuments = await this.fileService.getStudentUploadedFiles(
      studentId,
    );
    return studentDocuments.map((studentDocument) => ({
      fileName: studentDocument.fileName,
      uniqueFileName: studentDocument.uniqueFileName,
      metadata: studentDocument.metadata,
      groupName: studentDocument.groupName,
      updatedAt: studentDocument.updatedAt,
    }));
  }
}
