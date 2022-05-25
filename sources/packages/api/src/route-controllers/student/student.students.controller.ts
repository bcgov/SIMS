import {
  BadRequestException,
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
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { StudentUserToken } from "../../auth/userToken.interface";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  RequiresStudentAccount,
  UserToken,
} from "../../auth/decorators";
import {
  ApplicationService,
  APPLICATION_NOT_FOUND,
  ATBCService,
  FormService,
  GCNotifyActionsService,
  StudentFileService,
  StudentService,
} from "../../services";
import BaseController from "../BaseController";
import {
  CreateStudentAPIInDTO,
  StudentContactAPIOutDTO,
  StudentFileUploaderAPIInDTO,
  StudentProfileAPIOutDTO,
  StudentUploadFileAPIOutDTO,
  UpdateStudentAPIInDTO,
} from "./models/student.dto";
import {
  ApiProcessError,
  ATBCCreateClientPayload,
  ClientTypeBaseRoute,
} from "../../types";
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
import { StudentInfo } from "../../services/student/student.service.models";
import { AddressInfo } from "../../database/entities";

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
    private readonly atbcService: ATBCService,
  ) {
    super();
  }

  /**
   * Creates the student checking for an existing user to be used or
   * creating a new one in case the user id is not provided.
   * The user could be already available in the case of the same user
   * was authenticated previously on another portal (e.g. parent/partner).
   * @param payload information needed to create the user.
   */
  @Post()
  @ApiUnprocessableEntityResponse({
    description:
      "There is already a student associated with the user or the request is invalid.",
  })
  @RequiresStudentAccount(false)
  async create(
    @UserToken() userToken: StudentUserToken,
    @Body() payload: CreateStudentAPIInDTO,
  ): Promise<void> {
    if (userToken.userId) {
      // Checks if a student account already exists associated with the current user.
      if (userToken.studentId) {
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
      throw new UnprocessableEntityException(
        "Not able to create a student due to an invalid request.",
      );
    }

    const studentInfo = submissionResult.data.data as StudentInfo;
    await this.studentService.createStudent(userToken, studentInfo);
  }

  /**
   * Updates the student information that the student is allowed to change
   * in the solution. Other data must be edited outside (e.g. BCSC).
   * @param payload information to be updated.
   */
  @Patch()
  @ApiBadRequestResponse({
    description: "Not able to update a student due to an invalid request.",
  })
  async update(
    @UserToken() userToken: StudentUserToken,
    @Body() payload: UpdateStudentAPIInDTO,
  ): Promise<void> {
    const submissionResult = await this.formService.dryRunSubmission(
      FormNames.StudentInformation,
      payload,
    );
    if (!submissionResult.valid) {
      throw new BadRequestException(
        "Not able to update a student due to an invalid request.",
      );
    }
    await this.studentService.updateStudentContactByStudentId(
      userToken.studentId,
      submissionResult.data.data,
    );
  }

  @Get("contact")
  async getContactInfo(
    @UserToken() userToken: StudentUserToken,
  ): Promise<StudentContactAPIOutDTO> {
    const student = await this.studentService.getStudentById(
      userToken.studentId,
    );
    const address = student.contactInfo.address ?? ({} as AddressInfo);
    return {
      phone: student.contactInfo.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      provinceState: address.provinceState,
      country: address.country,
      postalCode: address.postalCode,
    };
  }

  /**
   * Creates the request for ATBC PD evaluation.
   * Student should only be allowed to check the PD status once and the
   * SIN validation must be already done with a successful result.
   */
  @Patch("apply-pd-status")
  @ApiUnprocessableEntityResponse({
    description:
      "Either the client does not have a validated SIN or the request was already sent to ATBC.",
  })
  async applyForPDStatus(
    @UserToken() userToken: StudentUserToken,
  ): Promise<void> {
    // Get student details
    const student = await this.studentService.getStudentById(
      userToken.studentId,
    );
    // Check the PD status in DB. Student should only be allowed to check the PD status once.
    // studentPDSentAt is set when student apply for PD status for the first.
    // studentPDVerified is null before PD scheduled job update status.
    // studentPDVerified is true if PD confirmed by ATBC or is true from sfas_individual table.
    // studentPDVerified is false if PD denied by ATBC.
    if (
      !student.sinValidation.isValidSIN ||
      !!student.studentPDSentAt ||
      student.studentPDVerified !== null
    ) {
      throw new UnprocessableEntityException(
        "Either the client does not have a validated SIN or the request was already sent to ATBC.",
      );
    }

    // Create client payload.
    const payload: ATBCCreateClientPayload = {
      SIN: student.sin,
      firstName: student.user.firstName,
      lastName: student.user.lastName,
      email: student.user.email,
      birthDate: student.birthDate,
    };
    // API to create student profile in ATBC.
    const response = await this.atbcService.ATBCCreateClient(payload);
    if (response) {
      // Update PD Sent Date.
      await this.studentService.updatePDSentDate(student.id);
    }
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
