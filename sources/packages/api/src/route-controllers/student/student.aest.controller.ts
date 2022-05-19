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
  StudentDetailAPIOutDTO,
} from "./models/student.dto";
import { Response } from "express";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  defaultFileFilter,
  determinePDStatus,
  getISODateOnlyString,
  getUserFullName,
  MAX_UPLOAD_FILES,
  MAX_UPLOAD_PARTS,
  MINISTRY_FILE_UPLOAD_GROUP_NAME,
  uploadLimits,
} from "../../utilities";
import { IUserToken } from "../../auth/userToken.interface";
import { StudentControllerService } from "..";
import { FileOriginType } from "../../database/entities/student-file.type";
import { FileCreateAPIOutDTO } from "../models/common.dto";
import { AddressInfo } from "../../database/entities";

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
   * API to fetch student details by studentId.
   * This API will be used by ministry users.
   * @param studentId
   * @returns Student Details
   */
  @Get(":studentId")
  async getStudentDetails(
    @Param("studentId") studentId: number,
  ): Promise<StudentDetailAPIOutDTO> {
    const student = await this.studentService.getStudentById(studentId);
    const address = student.contactInfo.address ?? ({} as AddressInfo);
    return {
      firstName: student.user.firstName,
      lastName: student.user.lastName,
      fullName: getUserFullName(student.user),
      email: student.user.email,
      gender: student.gender,
      dateOfBirth: getISODateOnlyString(student.birthDate),
      contact: {
        address: {
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2,
          city: address.city,
          provinceState: address.provinceState,
          country: address.country,
          postalCode: address.postalCode,
        },
        phone: student.contactInfo.phone,
      },
      pdStatus: determinePDStatus(student),
      pdVerified: student.studentPDVerified,
    };
  }
}
