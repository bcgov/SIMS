import { Controller, Get, Injectable, NotFoundException } from "@nestjs/common";
import { ApiNotFoundResponse, ApiTags } from "@nestjs/swagger";
import { IUserToken, StudentUserToken } from "../../auth/userToken.interface";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  RequiresStudentAccount,
  UserToken,
} from "../../auth/decorators";
import { StudentFileService, StudentService } from "../../services";
import BaseController from "../BaseController";
import { StudentUploadFileDTO } from "./models/student.dto";
import { ClientTypeBaseRoute } from "../../types";

/**
 * Student controller for Student Client.
 */
@AllowAuthorizedParty(AuthorizedParties.student)
@RequiresStudentAccount()
@Controller("students")
@ApiTags(`${ClientTypeBaseRoute.Student}-students`)
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
  @ApiNotFoundResponse({
    description: "The user does not have a student account associated with.",
  })
  async getStudentFiles(
    @UserToken() userToken: StudentUserToken,
  ): Promise<StudentUploadFileDTO[]> {
    const studentDocuments = await this.fileService.getStudentUploadedFiles(
      userToken.studentId,
    );
    return studentDocuments.map((studentDocument) => ({
      fileName: studentDocument.fileName,
      uniqueFileName: studentDocument.uniqueFileName,
    }));
  }
}
