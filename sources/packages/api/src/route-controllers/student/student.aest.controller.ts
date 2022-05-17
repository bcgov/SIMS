import {
  Body,
  Controller,
  Get,
  Injectable,
  NotFoundException,
  Param,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { ApiNotFoundResponse, ApiTags } from "@nestjs/swagger";
import {
  GCNotifyActionsService,
  StudentFileService,
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
} from "./models/student.dto";
import { Response } from "express";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  defaultFileFilter,
  MAX_UPLOAD_FILES,
  MAX_UPLOAD_PARTS,
  uploadLimits,
} from "../../utilities";
import { IUserToken } from "../../auth/userToken.interface";
import { StudentControllerService } from "..";
import { FileOriginType } from "../../database/entities/student-file.type";
import { FileCreateAPIOutDTO } from "../models/common.dto";

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
  ) {
    super();
  }

  /**
   * This controller returns all student documents uploaded
   * by student uploader.
   * @param studentId
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
   * All the file uploaded are first saved as temporary file in
   * the DB. When this endpoint is called, the temporary
   * files (saved during the upload) are update to its proper
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
    // Updates the preciously temporary uploaded files.
    await this.fileService.updateStudentFiles(
      studentId,
      userToken.userId,
      payload.associatedFiles,
      FileOriginType.Ministry,
      "Uploaded by SABC",
      undefined,
      sendFileUploadNotification,
    );
  }
}
