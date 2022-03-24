import { Controller, Get, Injectable, NotFoundException } from "@nestjs/common";
import { ApiNotFoundResponse, ApiTags } from "@nestjs/swagger";
import { IUserToken } from "../../auth/userToken.interface";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, UserToken } from "../../auth/decorators";
import { StudentService } from "../../services";
import BaseController from "../BaseController";
import { StudentUploadFileDTO } from "./models/student.dto";
import { StudentControllerService } from "./student.controller.service";

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
    private readonly studentControllerService: StudentControllerService,
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
    return this.studentControllerService.getStudentFiles(existingStudent.id);
  }
}
