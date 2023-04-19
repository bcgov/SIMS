import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from "@nestjs/common";
import { ApiNotFoundResponse, ApiTags } from "@nestjs/swagger";
import { StudentService, StudentFileService } from "../../services";
import { ClientTypeBaseRoute } from "../../types";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, UserToken } from "../../auth/decorators";
import BaseController from "../BaseController";
import {
  StudentSearchAPIInDTO,
  SearchStudentAPIOutDTO,
  StudentProfileAPIOutDTO,
  InstitutionStudentFileAPIOutDTO,
} from "./models/student.dto";
import { IInstitutionUserToken } from "../../auth";
import { StudentControllerService } from "./student.controller.service";

/**
 * Student controller for institutions.
 */
@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("student")
@ApiTags(`${ClientTypeBaseRoute.Institution}-student`)
export class StudentInstitutionsController extends BaseController {
  constructor(
    private readonly studentService: StudentService,
    private readonly fileService: StudentFileService,
    private readonly studentControllerService: StudentControllerService,
  ) {
    super();
  }

  /**
   * Search students based on the search criteria.
   * TODO add decorator to restrict to BC Public institutions.
   * @param searchCriteria criteria to be used in the search.
   * @returns searched student details.
   */
  @Post("search")
  async searchStudents(
    @UserToken() userToken: IInstitutionUserToken,
    @Body() searchCriteria: StudentSearchAPIInDTO,
  ): Promise<SearchStudentAPIOutDTO[]> {
    const students = await this.studentService.searchStudent(
      searchCriteria,
      userToken.authorizations.institutionId,
    );
    return this.studentControllerService.transformStudentsToSearchStudentDetails(
      students,
    );
  }

  /**
   * Get the student information that represents the profile.
   * TODO: Authorization must be enabled to validate if the student has submitted
   * at least one application for the institution of the user.
   * @param studentId student.
   * @returns student profile details.
   */
  @Get(":studentId")
  @ApiNotFoundResponse({ description: "Student not found." })
  async getStudentProfile(
    @Param("studentId", ParseIntPipe) studentId: number,
  ): Promise<StudentProfileAPIOutDTO> {
    return this.studentControllerService.getStudentProfile(studentId);
  }

  /**
   * This controller returns all student documents uploaded by student uploader.
   * @param studentId student id.
   * @returns list of student documents.
   */
  @Get(":studentId/documents")
  async getInstitutionStudentFiles(
    @Param("studentId", ParseIntPipe) studentId: number,
  ): Promise<InstitutionStudentFileAPIOutDTO[]> {
    const studentDocuments = await this.fileService.getStudentUploadedFiles(
      studentId,
    );
    return studentDocuments.map((studentDocument) => ({
      fileName: studentDocument.fileName,
      uniqueFileName: studentDocument.uniqueFileName,
      metadata: studentDocument.metadata,
      groupName: studentDocument.groupName,
      updatedAt: studentDocument.updatedAt,
      fileOrigin: studentDocument.fileOrigin,
    }));
  }
}
