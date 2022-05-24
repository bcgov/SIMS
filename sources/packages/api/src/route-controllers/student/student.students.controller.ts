import {
  Body,
  Controller,
  Get,
  Injectable,
  Param,
  Patch,
  Post,
  Res,
  UnprocessableEntityException,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { ApiNotFoundResponse, ApiTags } from "@nestjs/swagger";
import { IUserToken, StudentUserToken } from "../../auth/userToken.interface";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  RequiresStudentAccount,
  UserToken,
} from "../../auth/decorators";
import {
  ApplicationService,
  APPLICATION_NOT_FOUND,
  FormService,
  GCNotifyActionsService,
  StudentFileService,
  StudentService,
} from "../../services";
import BaseController from "../BaseController";
import {
  CreateStudentAPIInDTO,
  StudentFileUploaderAPIInDTO,
  StudentProfileAPIOutDTO,
  StudentUploadFileAPIOutDTO,
} from "./models/student.dto";
import { ApiProcessError, ClientTypeBaseRoute } from "../../types";
import { Response } from "express";
import { StudentControllerService } from "..";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  defaultFileFilter,
  MAX_UPLOAD_FILES,
  MAX_UPLOAD_PARTS,
  uploadLimits,
} from "../../utilities";
import { FileOriginType } from "../../database/entities/student-file.type";
import { FileCreateAPIOutDTO } from "../models/common.dto";
import { FormNames } from "../../services/form/constants";

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
    private readonly gcNotifyActionsService: GCNotifyActionsService,
    private readonly applicationService: ApplicationService,
    private readonly studentService: StudentService,
    private readonly formService: FormService,
  ) {
    super();
  }

  /**
   * Creates the student checking for an existing user to be used or
   * creating a new one in case the user id is not provided.
   * The user could be already available in the case of the same user
   * was authenticated previously on another portal (e.g. parent/partner).
   * @param payload information needed to create/update the user.
   * @param userToken authenticated user information.
   */
  @Post()
  @RequiresStudentAccount(false)
  async create(
    @UserToken() userToken: IUserToken,
    @Body() payload: CreateStudentAPIInDTO,
  ): Promise<void> {
    if (userToken.userId) {
      // If the user already exists, verify if there is already a student
      // associated with the existing user.
      const existingStudent = await this.studentService.getStudentByUserId(
        userToken.userId,
      );
      if (existingStudent) {
        throw new UnprocessableEntityException(
          "There is already a student associated with the user.",
        );
      }
    }

    const submissionResult = await this.formService.dryRunSubmission(
      FormNames.StudentInformation,
      payload,
    );
    if (!submissionResult.valid) {
      throw new BadRequestException(
        "Not able to create a student due to an invalid request.",
      );
    }

    await this.studentService.createStudent(userToken, {
      ...submissionResult.data.data,
      sinNumber: payload.sinNumber,
    });
  }

  /**
   * Gets all student documents uploaded to the student account.
   * @returns list of student documents.
   */
  @Get("documents")
  async getStudentFiles(
    @UserToken() userToken: StudentUserToken,
  ): Promise<StudentUploadFileAPIOutDTO[]> {
    const studentDocuments = await this.fileService.getStudentUploadedFiles(
      userToken.studentId,
    );
    return studentDocuments.map((studentDocument) => ({
      fileName: studentDocument.fileName,
      uniqueFileName: studentDocument.uniqueFileName,
      fileOrigin: studentDocument.fileOrigin,
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

  /**
   * Saves the student files submitted via student uploader form.
   * All the files uploaded are first saved as temporary
   * file in the db.when this controller/api is called
   * during form submission, the temporary files
   * (saved during the upload) are update to its proper
   * group,file_origin and add the metadata (if available).
   * @param userToken authentication token.
   * @Body list of files to be be saved.
   */
  @Patch("save-uploaded-files")
  async saveStudentUploadedFiles(
    @UserToken() userToken: StudentUserToken,
    @Body() payload: StudentFileUploaderAPIInDTO,
  ): Promise<void> {
    if (payload.submittedForm.applicationNumber) {
      // Here we are checking the existence of an application irrespective of its status
      const validApplication =
        await this.applicationService.doesApplicationExist(
          payload.submittedForm.applicationNumber,
          userToken.studentId,
        );

      if (!validApplication) {
        throw new UnprocessableEntityException(
          new ApiProcessError(
            "Application number not found",
            APPLICATION_NOT_FOUND,
          ),
        );
      }
    }

    const student = await this.studentService.getStudentById(
      userToken.studentId,
    );

    // This method will be executed alongside with the transaction during the
    // execution of the method updateStudentFiles.
    const sendFileUploadNotification = () =>
      this.gcNotifyActionsService.sendFileUploadNotification({
        firstName: student.user.firstName,
        lastName: student.user.lastName,
        birthDate: student.birthDate,
        documentPurpose: payload.submittedForm.documentPurpose,
        applicationNumber: payload.submittedForm.applicationNumber,
      });

    const fileMetadata = payload.submittedForm.applicationNumber
      ? { applicationNumber: payload.submittedForm.applicationNumber }
      : null;
    // All the files uploaded are first saved as temporary file in the db.
    // when this controller/api is called during form submission, the temporary
    // files (saved during the upload) are updated to its proper group, file origin
    // and add the metadata (if available).
    await this.fileService.updateStudentFiles(
      userToken.studentId,
      userToken.userId,
      payload.associatedFiles,
      FileOriginType.Student,
      payload.submittedForm.documentPurpose,
      sendFileUploadNotification,
      fileMetadata,
    );
  }

  /**
   * Get the student information that represents the profile.
   * @returns student profile information.
   */
  @Get()
  async getStudentProfile(
    @UserToken() userToken: StudentUserToken,
  ): Promise<StudentProfileAPIOutDTO> {
    return this.studentControllerService.getStudentProfile(userToken.studentId);
  }
}
