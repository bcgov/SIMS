import {
  Body,
  Controller,
  Get,
  Injectable,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { ApiNotFoundResponse, ApiTags } from "@nestjs/swagger";
import { StudentUserToken } from "../../auth/userToken.interface";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  RequiresStudentAccount,
  UserToken,
} from "../../auth/decorators";
import { StudentFileService } from "../../services";
import BaseController from "../BaseController";
import {
  FileCreateAPIOutDTO,
  StudentUploadFileDTO,
} from "./models/student.dto";
import { ClientTypeBaseRoute } from "../../types";
import { Response } from "express";
import { StudentControllerService } from "..";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  defaultFileFilter,
  MAX_UPLOAD_FILES,
  MAX_UPLOAD_PARTS,
  uploadLimits,
} from "src/utilities";

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
    private readonly fileService: StudentFileService,
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

  /**
   * Gets a student file and writes it to the HTTP response.
   * @param uniqueFileName unique file name (name+guid).
   * @param response file content.
   */
  @Get("files/:uniqueFileName")
  @ApiNotFoundResponse({
    description:
      "Requested file was not found or the user does not have access to it.",
  })
  async getUploadedFile(
    @UserToken() userToken: StudentUserToken,
    @Param("uniqueFileName") uniqueFileName: string,
    @Res() response: Response,
  ): Promise<void> {
    await this.studentControllerService.writeFileToResponse(
      response,
      uniqueFileName,
      userToken.studentId,
    );
  }

  /**
   * Allow files uploads to a particular student.
   * @param userToken authentication token.
   * @param file file content.
   * @param uniqueFileName unique file name (name+guid).
   * @param groupName friendly name to group files. Currently using
   * the value from 'Directory' property from form.IO file component.
   * @returns created file information.
   */
  @Post("files")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: uploadLimits(MAX_UPLOAD_FILES, MAX_UPLOAD_PARTS),
      fileFilter: defaultFileFilter,
    }),
  )
  async uploadFile(
    @UserToken() userToken: StudentUserToken,
    @UploadedFile() file: Express.Multer.File,
    @Body("uniqueFileName") uniqueFileName: string,
    @Body("group") groupName: string,
  ): Promise<FileCreateAPIOutDTO> {
    return this.studentControllerService.uploadFile(
      userToken.studentId,
      file,
      uniqueFileName,
      groupName,
      userToken.userId,
    );
  }
}
