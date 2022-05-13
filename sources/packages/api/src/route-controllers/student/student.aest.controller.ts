import {
  Body,
  Controller,
  Get,
  Injectable,
  NotFoundException,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { ApiNotFoundResponse, ApiTags } from "@nestjs/swagger";
import { StudentFileService, StudentService } from "../../services";
import { ClientTypeBaseRoute } from "../../types";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, Groups, UserToken } from "../../auth/decorators";
import { UserGroups } from "../../auth/user-groups.enum";
import BaseController from "../BaseController";
import { AESTStudentFileDTO, FileCreateAPIOutDTO } from "./models/student.dto";
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
  ) {
    super();
  }

  /**
   * This controller returns all student documents uploaded
   * by student uploader.
   * @param studentId
   * @returns list of student documents as AESTStudentFileDTO.
   */
  @Get(":studentId/documents")
  async getAESTStudentFiles(
    @Param("studentId") studentId: number,
  ): Promise<AESTStudentFileDTO[]> {
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
}
