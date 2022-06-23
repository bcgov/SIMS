import {
  Body,
  Controller,
  Get,
  Injectable,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { ApiNotFoundResponse, ApiTags } from "@nestjs/swagger";
import {
  GCNotifyActionsService,
  SINValidationService,
  StudentFileService,
  StudentRestrictionService,
  StudentService,
} from "../../services";
import { ClientTypeBaseRoute } from "../../types";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, Groups, UserToken } from "../../auth/decorators";
import { UserGroups } from "../../auth/user-groups.enum";
import BaseController from "../BaseController";
import {
  AESTFileUploadToStudentAPIInDTO,
  AESTStudentFileAPIOutDTO,
  AESTStudentProfileAPIOutDTO,
  AESTStudentSearchAPIInDTO,
  ApplicationSummaryAPIOutDTO,
  SearchStudentAPIOutDTO,
  SINValidationsAPIOutDTO,
} from "./models/student.dto";
import { Response } from "express";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  defaultFileFilter,
  getISODateOnlyString,
  MAX_UPLOAD_FILES,
  MAX_UPLOAD_PARTS,
  MINISTRY_FILE_UPLOAD_GROUP_NAME,
  uploadLimits,
} from "../../utilities";
import { IUserToken } from "../../auth/userToken.interface";
import { StudentControllerService } from "..";
import { FileOriginType } from "../../database/entities/student-file.type";
import { FileCreateAPIOutDTO } from "../models/common.dto";
import {
  ApplicationPaginationOptionsAPIInDTO,
  PaginatedResultsAPIOutDTO,
} from "../models/pagination.dto";
import { Student } from "../../database/entities";

/**
 * Student controller for AEST Client.
 */
@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("students")
@ApiTags(`${ClientTypeBaseRoute.AEST}-students`)
@Injectable()
export class StudentAESTController extends BaseController {
  constructor(
    private readonly fileService: StudentFileService,
    private readonly studentService: StudentService,
    private readonly studentControllerService: StudentControllerService,
    private readonly gcNotifyActionsService: GCNotifyActionsService,
    private readonly studentRestrictionService: StudentRestrictionService,
    private readonly sinValidationService: SINValidationService,
  ) {
    super();
  }

  /**
   * This controller returns all student documents uploaded
   * by student uploader.
   * @param studentId student id.
   * @returns list of student documents.
   */
  @Get(":studentId/documents")
  async getAESTStudentFiles(
    @Param("studentId") studentId: number,
  ): Promise<AESTStudentFileAPIOutDTO[]> {
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

  /**
   * Gets a student file and writes it to the HTTP response.
   * @param uniqueFileName unique file name (name+guid).
   * @param response file content.
   */
  @Get("files/:uniqueFileName")
  @ApiNotFoundResponse({ description: "Requested file was not found." })
  async getUploadedFile(
    @Param("uniqueFileName") uniqueFileName: string,
    @Res() response: Response,
  ): Promise<void> {
    await this.studentControllerService.writeFileToResponse(
      response,
      uniqueFileName,
    );
  }

  /**
   * Allow files uploads to a particular student.
   * @param userToken authentication token.
   * @param studentId student to receive the uploaded file.
   * @param file file content.
   * @param uniqueFileName unique file name (name+guid).
   * @param groupName friendly name to group files. Currently using
   * the value from 'Directory' property from form.IO file component.
   * @returns created file information.
   */
  @Post(":studentId/files")
  @ApiNotFoundResponse({ description: "Student was not found." })
  @UseInterceptors(
    FileInterceptor("file", {
      limits: uploadLimits(MAX_UPLOAD_FILES, MAX_UPLOAD_PARTS),
      fileFilter: defaultFileFilter,
    }),
  )
  async uploadFile(
    @UserToken() userToken: IUserToken,
    @Param("studentId") studentId: number,
    @UploadedFile() file: Express.Multer.File,
    @Body("uniqueFileName") uniqueFileName: string,
    @Body("group") groupName: string,
  ): Promise<FileCreateAPIOutDTO> {
    const studentExists = this.studentService.studentExists(studentId);
    if (!studentExists) {
      throw new NotFoundException("Student was not found.");
    }

    return this.studentControllerService.uploadFile(
      studentId,
      file,
      uniqueFileName,
      groupName,
      userToken.userId,
    );
  }

  /**
   * Saves the files submitted by the Ministry to the student.
   * All the files uploaded are first saved as temporary file in
   * the DB. When this endpoint is called, the temporary
   * files (saved during the upload) are updated to its proper
   * group and file origin.
   * @param userToken user authentication.
   * @param studentId student to have the file saved.
   * @param payload list of files to be saved.
   */
  @Patch(":studentId/save-uploaded-files")
  @ApiNotFoundResponse({ description: "Student not found." })
  async saveStudentUploadedFiles(
    @UserToken() userToken: IUserToken,
    @Param("studentId") studentId: number,
    @Body() payload: AESTFileUploadToStudentAPIInDTO,
  ): Promise<void> {
    const student = await this.studentService.getStudentById(studentId);
    if (!studentId) {
      throw new NotFoundException("Student not found.");
    }

    // This method will be executed alongside with the transaction during the
    // execution of the method updateStudentFiles.
    const sendFileUploadNotification = () =>
      this.gcNotifyActionsService.sendMinistryFileUploadNotification({
        firstName: student.user.firstName,
        lastName: student.user.lastName,
        toAddress: student.user.email,
      });
    // Updates the previously temporary uploaded files.
    await this.fileService.updateStudentFiles(
      studentId,
      userToken.userId,
      payload.associatedFiles,
      FileOriginType.Ministry,
      MINISTRY_FILE_UPLOAD_GROUP_NAME,
      sendFileUploadNotification,
    );
  }

  /**
   * Search students based on the search criteria.
   * @param searchCriteria criteria to be used in the search.
   * @returns searched student details.
   */
  @Get("search")
  async searchStudents(
    @Query() searchCriteria: AESTStudentSearchAPIInDTO,
  ): Promise<SearchStudentAPIOutDTO[]> {
    const searchStudentApplications =
      await this.studentService.searchStudentApplication(searchCriteria);
    return searchStudentApplications.map((eachStudent: Student) => ({
      id: eachStudent.id,
      firstName: eachStudent.user.firstName,
      lastName: eachStudent.user.lastName,
      birthDate: getISODateOnlyString(eachStudent.birthDate),
    }));
  }

  /**
   * Get the student information that represents the profile.
   * @param studentId student id to retrieve the data.
   * @returns student profile details.
   */
  @Get(":studentId")
  @ApiNotFoundResponse({ description: "Not able to find the student." })
  async getStudentProfile(
    @Param("studentId") studentId: number,
  ): Promise<AESTStudentProfileAPIOutDTO> {
    const [student, studentRestrictions] = await Promise.all([
      this.studentControllerService.getStudentProfile(studentId),
      this.studentRestrictionService.getStudentRestrictionsById(
        studentId,
        true,
      ),
    ]);

    if (!student) {
      throw new NotFoundException("Not able to find the student.");
    }
    return { ...student, hasRestriction: !!studentRestrictions.length };
  }

  /**
   * Get the list of applications that belongs to a student on a summary view format.
   * @param studentId student id to retrieve the application summary.
   * @param pagination options to execute the pagination.
   * @returns student application list with total count.
   */
  @Get(":studentId/application-summary")
  @ApiNotFoundResponse({ description: "Student does not exists." })
  async getStudentApplicationSummary(
    @Param("studentId") studentId: number,
    @Query() pagination: ApplicationPaginationOptionsAPIInDTO,
  ): Promise<PaginatedResultsAPIOutDTO<ApplicationSummaryAPIOutDTO>> {
    const studentExists = await this.studentService.studentExists(studentId);
    if (!studentExists) {
      throw new NotFoundException("Student does not exists.");
    }
    return this.studentControllerService.getStudentApplicationSummary(
      studentId,
      pagination,
    );
  }

  /**
   * Get the SIN validations associated with the student user.
   * @param studentId student to retrieve the SIN validations.
   * @returns the history of SIN validations associated with the student user.
   */
  @Get(":studentId/sin-validations")
  @ApiNotFoundResponse({ description: "Student does not exists." })
  async getStudentSINValidations(
    @Param("studentId") studentId: number,
  ): Promise<SINValidationsAPIOutDTO[]> {
    const student = await this.studentService.getStudentById(studentId);
    if (!student) {
      throw new NotFoundException("Student does not exists.");
    }
    const sinValidations =
      await this.sinValidationService.getSINValidationByUserId(student.user.id);

    return sinValidations?.map((sinValidation) => ({
      id: sinValidation.id,
      sin: sinValidation.sin,
      createdAt: sinValidation.createdAt,
      isValidSIN: sinValidation.isValidSIN,
      sinStatus: sinValidation.sinStatus,
      validSINCheck: sinValidation.validSINCheck,
      validBirthdateCheck: sinValidation.validBirthdateCheck,
      validFirstNameCheck: sinValidation.validFirstNameCheck,
      validLastNameCheck: sinValidation.validLastNameCheck,
      validGenderCheck: sinValidation.validGenderCheck,
      temporarySIN: sinValidation.temporarySIN,
      sinExpireDate: getISODateOnlyString(sinValidation.sinExpireDate),
    }));
  }
}
