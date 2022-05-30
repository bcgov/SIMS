import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Injectable,
  Param,
  Patch,
  Post,
  Query,
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
  StudentRestrictionService,
  StudentService,
} from "../../services";
import BaseController from "../BaseController";
import {
  ApplicationSummaryAPIOutDTO,
  CreateStudentAPIInDTO,
  StudentFileUploaderAPIInDTO,
  StudentProfileAPIOutDTO,
  StudentRestrictionAPIOutDTO,
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
  PaginatedResults,
  uploadLimits,
} from "../../utilities";
import { FileOriginType } from "../../database/entities/student-file.type";
import { FileCreateAPIOutDTO } from "../models/common.dto";
import { ApplicationPaginationOptionsAPIInDTO } from "../models/pagination.dto";
import { FormNames } from "../../services/form/constants";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";

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
    private readonly studentRestrictionService: StudentRestrictionService,
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
    @UserToken() studentUserToken: StudentUserToken,
    @Body() payload: CreateStudentAPIInDTO,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    // Checks if a student account is already associated with the current user.
    if (studentUserToken.studentId) {
      throw new UnprocessableEntityException(
        "There is already a student associated with the user.",
      );
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

    const createdStudent = await this.studentService.createStudent(
      studentUserToken,
      submissionResult.data.data,
    );

    return { id: createdStudent.id };
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
    @UserToken() studentUserToken: StudentUserToken,
  ): Promise<void> {
    // Get student details
    const student = await this.studentService.getStudentById(
      studentUserToken.studentId,
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
   * Use the information available in the authentication token to update
   * the user and student data currently on DB.
   */
  @Patch("/sync")
  async synchronizeFromUserToken(
    @UserToken() studentUserToken: StudentUserToken,
  ): Promise<void> {
    await this.studentService.synchronizeFromUserToken(studentUserToken);
  }

  /**
   * Gets all student documents uploaded to the student account.
   * @returns list of student documents.
   */
  @Get("documents")
  async getStudentFiles(
    @UserToken() studentUserToken: StudentUserToken,
  ): Promise<StudentUploadFileAPIOutDTO[]> {
    const studentDocuments = await this.fileService.getStudentUploadedFiles(
      studentUserToken.studentId,
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
    @UserToken() studentUserToken: StudentUserToken,
    @Param("uniqueFileName") uniqueFileName: string,
    @Res() response: Response,
  ): Promise<void> {
    await this.studentControllerService.writeFileToResponse(
      response,
      uniqueFileName,
      studentUserToken.studentId,
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
    @UserToken() studentUserToken: StudentUserToken,
    @UploadedFile() file: Express.Multer.File,
    @Body("uniqueFileName") uniqueFileName: string,
    @Body("group") groupName: string,
  ): Promise<FileCreateAPIOutDTO> {
    return this.studentControllerService.uploadFile(
      studentUserToken.studentId,
      file,
      uniqueFileName,
      groupName,
      studentUserToken.userId,
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
    @UserToken() studentUserToken: StudentUserToken,
    @Body() payload: StudentFileUploaderAPIInDTO,
  ): Promise<void> {
    if (payload.submittedForm.applicationNumber) {
      // Here we are checking the existence of an application irrespective of its status
      const validApplication =
        await this.applicationService.doesApplicationExist(
          payload.submittedForm.applicationNumber,
          studentUserToken.studentId,
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
      studentUserToken.studentId,
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
      studentUserToken.studentId,
      studentUserToken.userId,
      payload.associatedFiles,
      FileOriginType.Student,
      payload.submittedForm.documentPurpose,
      sendFileUploadNotification,
      fileMetadata,
    );
  }

  /**
   * Updates the student information that the student is allowed to change
   * in the solution. Other data must be edited externally (e.g. BCSC).
   * @param payload information to be updated.
   */
  @Patch()
  @ApiBadRequestResponse({
    description: "Not able to update a student due to an invalid request.",
  })
  async update(
    @UserToken() studentUserToken: StudentUserToken,
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
      studentUserToken.studentId,
      submissionResult.data.data,
    );
  }

  /**
   * Get the list of applications that belongs to a student on a summary view format.
   * @param pagination options to execute the pagination.
   * @returns student application list with total count.
   */
  @Get("application-summary")
  async getStudentApplicationSummary(
    @Query() pagination: ApplicationPaginationOptionsAPIInDTO,
    @UserToken() studentUserToken: StudentUserToken,
  ): Promise<PaginatedResults<ApplicationSummaryAPIOutDTO>> {
    return this.studentControllerService.getStudentApplicationSummary(
      studentUserToken.studentId,
      pagination,
    );
  }

  /**
   * GET API which returns student restriction details.
   * @param studentToken student token.
   * @returns Student restriction code and notification type, if any.
   */
  @Get("restriction")
  async getStudentRestrictions(
    @UserToken() studentToken: StudentUserToken,
  ): Promise<StudentRestrictionAPIOutDTO[]> {
    const studentRestrictions =
      await this.studentRestrictionService.getStudentRestrictionsById(
        studentToken.studentId,
      );

    return studentRestrictions?.map((studentRestriction) => ({
      code: studentRestriction.restriction.restrictionCode,
      type: studentRestriction.restriction.notificationType,
    }));
  }

  /**
   * Get the student information that represents the profile.
   * @returns student profile information.
   */
  @Get()
  async getStudentProfile(
    @UserToken() studentUserToken: StudentUserToken,
  ): Promise<StudentProfileAPIOutDTO> {
    return this.studentControllerService.getStudentProfile(
      studentUserToken.studentId,
    );
  }
}
