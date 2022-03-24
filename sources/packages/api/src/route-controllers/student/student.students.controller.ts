import { Controller, Get, Injectable, NotFoundException } from "@nestjs/common";
import { ApiNotFoundResponse, ApiTags } from "@nestjs/swagger";
import { IUserToken } from "../../auth/userToken.interface";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, UserToken } from "../../auth/decorators";
import { StudentFileService, StudentService } from "../../services";
import BaseController from "../BaseController";
import { StudentUploadFileDTO } from "./models/student.dto";

/**
 * Student controller for Student Client.
 */
@AllowAuthorizedParty(AuthorizedParties.student)
@Controller("students")
@ApiTags("students")
@Injectable()
export class StudentStudentsController extends BaseController {
  constructor(
    private readonly studentService: StudentService,
    private readonly fileService: StudentFileService,
  ) {
    super();
  }

  /**
   * This controller returns all student documents uploaded
   * by student uploader.
   * @returns list of student documents.
   */
  @Get("documents")
  @ApiNotFoundResponse({ description: "Student not found." })
  async getStudentFiles(
    @UserToken() userToken: IUserToken,
  ): Promise<StudentUploadFileDTO[]> {
    const existingStudent = await this.studentService.getStudentByUserId(
      userToken.userId,
    );
    if (!existingStudent) {
      throw new NotFoundException("Student Not found.");
    }
    const studentDocuments = await this.fileService.getStudentUploadedFiles(
      existingStudent.id,
    );
    return studentDocuments.map((studentDocument) => ({
      fileName: studentDocument.fileName,
      uniqueFileName: studentDocument.uniqueFileName,
    }));
  }
}
