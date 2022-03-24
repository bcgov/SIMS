import { Controller, Get, Injectable, Param } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, Groups } from "../../auth/decorators";
import { UserGroups } from "../../auth/user-groups.enum";
import BaseController from "../BaseController";
import { StudentUploadFileDTO } from "./models/student.dto";
import { StudentControllerService } from "./student.controller.service";

/**
 * Student controller for AEST Client.
 */
@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("students")
@ApiTags("students")
@Injectable()
export class StudentAESTController extends BaseController {
  constructor(
    private readonly studentControllerService: StudentControllerService,
  ) {
    super();
  }

  /**
   * This controller returns all student documents uploaded
   * by student uploader.
   * @returns list of student documents as StudentUploadFileDTO.
   */
  @Get("documents/:studentId")
  async getStudentFiles(
    @Param("studentId") studentId: number,
  ): Promise<StudentUploadFileDTO[]> {
    return this.studentControllerService.getStudentFiles(studentId);
  }
}
