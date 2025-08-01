import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  Patch,
  UnprocessableEntityException,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  ParseBoolPipe,
} from "@nestjs/common";
import {
  ApplicationService,
  StudentService,
  ProgramYearService,
  APPLICATION_DRAFT_NOT_FOUND,
  MORE_THAN_ONE_APPLICATION_DRAFT_ERROR,
  APPLICATION_NOT_FOUND,
  APPLICATION_NOT_VALID,
  INVALID_OPERATION_IN_THE_CURRENT_STATUS,
  ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE,
  APPLICATION_CHANGE_REQUEST_ALREADY_IN_PROGRESS,
} from "../../services";
import { IUserToken, StudentUserToken } from "../../auth/userToken.interface";
import BaseController from "../BaseController";
import {
  SaveApplicationAPIInDTO,
  ApplicationDataAPIOutDTO,
  ApplicationWithProgramYearAPIOutDTO,
  ApplicationProgramYearAPIOutDTO,
  InProgressApplicationDetailsAPIOutDTO,
  ApplicationProgressDetailsAPIOutDTO,
  EnrolmentApplicationDetailsAPIOutDTO,
  CompletedApplicationDetailsAPIOutDTO,
  ApplicationWarningsAPIOutDTO,
  ApplicationOverallDetailsAPIOutDTO,
  CreateApplicationAPIInDTO,
} from "./models/application.dto";
import {
  AllowAuthorizedParty,
  UserToken,
  CheckSinValidation,
  RequiresStudentAccount,
} from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { ApiProcessError, ClientTypeBaseRoute } from "../../types";
import { STUDY_DATE_OVERLAP_ERROR } from "../../utilities";
import {
  INSTITUTION_LOCATION_NOT_VALID,
  OFFERING_NOT_VALID,
} from "../../constants";
import {
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { ApplicationControllerService } from "./application.controller.service";
import { CustomNamedError } from "@sims/utilities";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";
import { ApplicationStatus, OfferingIntensity } from "@sims/sims-db";
import { ConfirmationOfEnrollmentService } from "@sims/services";
import { ConfigService } from "@sims/utilities/config";
import { ECertPreValidationService } from "@sims/integrations/services/disbursement-schedule/e-cert-calculation";

@AllowAuthorizedParty(AuthorizedParties.student)
@RequiresStudentAccount()
@Controller("application")
@ApiTags(`${ClientTypeBaseRoute.Student}-application`)
export class ApplicationStudentsController extends BaseController {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly studentService: StudentService,
    private readonly programYearService: ProgramYearService,
    private readonly confirmationOfEnrollmentService: ConfirmationOfEnrollmentService,
    private readonly applicationControllerService: ApplicationControllerService,
    private readonly configService: ConfigService,
    private readonly eCertPreValidationService: ECertPreValidationService,
  ) {
    super();
  }

  /**
   * Get application details by id.
   * @param id for the application to be retrieved.
   * @returns application details.
   */
  @Get(":id")
  @ApiNotFoundResponse({
    description: "Application id not found.",
  })
  async getByApplicationId(
    @Param("id", ParseIntPipe) applicationId: number,
    @UserToken() userToken: StudentUserToken,
  ): Promise<ApplicationDataAPIOutDTO> {
    const application = await this.applicationService.getApplicationById(
      applicationId,
      {
        loadDynamicData: true,
        studentId: userToken.studentId,
        allowEdited: true,
      },
    );
    if (!application) {
      throw new NotFoundException(
        `Application id ${applicationId} was not found.`,
      );
    }

    const applicationDataPromise =
      this.applicationControllerService.generateApplicationFormData(
        application.data,
      );
    const firstCOEPromise =
      this.confirmationOfEnrollmentService.getFirstDisbursementScheduleByApplication(
        applicationId,
      );
    const [applicationData, firstCOE] = await Promise.all([
      applicationDataPromise,
      firstCOEPromise,
    ]);

    application.data = applicationData;
    return this.applicationControllerService.transformToApplicationDetailForStudentDTO(
      application,
      firstCOE,
    );
  }

  /**
   * Get any warnings for the application.
   * @param applicationId application id.
   * @returns warnings information.
   */
  @Get(":applicationId/warnings")
  @ApiNotFoundResponse({
    description:
      "Applications does not exists or the student does not have access to it.",
  })
  async getApplicationWarnings(
    @Param("applicationId", ParseIntPipe) applicationId: number,
    @UserToken() userToken: StudentUserToken,
  ): Promise<ApplicationWarningsAPIOutDTO> {
    const applicationExist = await this.applicationService.doesApplicationExist(
      {
        applicationId,
        studentId: userToken.studentId,
      },
    );
    if (!applicationExist) {
      throw new NotFoundException(
        "Applications does not exists or the student does not have access to it.",
      );
    }
    const validationResult =
      await this.eCertPreValidationService.executePreValidations(
        applicationId,
        true,
      );
    return {
      eCertFailedValidations: [...validationResult.failedValidations],
      canAcceptAssessment: validationResult.canAcceptAssessment,
    };
  }

  /**
   * Submit an existing student application changing the status
   * to submitted and triggering the necessary processes.
   * The system will ensure that an application will always be
   * transitioning from draft to submitted status. The student
   * application is not supposed to be created directly in the
   * submitted status in any scenario.
   * @param payload payload to create the draft application.
   * @param applicationId application id to be changed to submitted.
   * @param studentToken token from the authenticated student.
   */
  @CheckSinValidation()
  @Patch(":applicationId/submit")
  @ApiUnprocessableEntityResponse({
    description:
      "Program Year is not active or " +
      "Selected offering id is invalid or " +
      "invalid study dates or selected study start date is not within the program year or " +
      "the education program is not active or " +
      "the education program is expired or " +
      "or INVALID_OPERATION_IN_THE_CURRENT_STATUS or ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE " +
      "or INSTITUTION_LOCATION_NOT_VALID or OFFERING_NOT_VALID " +
      "or Invalid offering intensity " +
      "or dynamic form configuration not found.",
  })
  @ApiBadRequestResponse({
    description: "Form validation failed or Offering intensity type is invalid",
  })
  @ApiNotFoundResponse({ description: "Application not found." })
  @ApiForbiddenResponse({
    description: "You have a restriction on your account.",
  })
  async submitApplication(
    @Body() payload: SaveApplicationAPIInDTO,
    @Param("applicationId", ParseIntPipe) applicationId: number,
    @UserToken() studentToken: StudentUserToken,
  ): Promise<void> {
    const validatedResult =
      await this.applicationControllerService.validateApplicationSubmission(
        applicationId,
        studentToken.studentId,
        payload,
      );

    // If offering is present, the selected offering's start and end dates will be used.
    let referenceStudyStartDate = validatedResult.selectedOfferingDate;
    let referencedStudyEndDate = validatedResult.selectedOfferingEndDate;
    if (!payload.data.selectedOffering) {
      // If offering is not present, the PIR provided study start and end dates will be used instead.
      referenceStudyStartDate = validatedResult.studystartDate;
      referencedStudyEndDate = validatedResult.studyendDate;
    }
    try {
      await this.applicationService.validateOverlappingDates(
        applicationId,
        studentToken.userId,
        studentToken.studentId,
        referenceStudyStartDate,
        referencedStudyEndDate,
      );
      await this.applicationService.submitApplication(
        applicationId,
        studentToken.userId,
        studentToken.studentId,
        validatedResult,
        payload.associatedFiles,
      );
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        switch (error.name) {
          case APPLICATION_NOT_FOUND:
            throw new NotFoundException(error.message);
          case INVALID_OPERATION_IN_THE_CURRENT_STATUS:
          case STUDY_DATE_OVERLAP_ERROR:
          case INSTITUTION_LOCATION_NOT_VALID:
          case OFFERING_NOT_VALID:
            throw new UnprocessableEntityException(
              new ApiProcessError(error.message, error.name),
            );
          case ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE:
            throw new UnprocessableEntityException(error.message);
        }
      }
      throw error;
    }
  }

  /**
   * Starts a change request for an existing student application.
   * A new application will be created in edited status and will be assessed by the Ministry.
   * @param payload complete application payload with all the data that should be considered as a new
   * application, if approved by the Ministry.
   * @param applicationId application ID to be changed.
   * @returns application ID of the created application that represents the change request.
   */
  @CheckSinValidation()
  @Post(":applicationId/change-request")
  @ApiUnprocessableEntityResponse({
    description:
      "Program year is not active " +
      "or selected offering ID is invalid " +
      "or the education program is not active " +
      "or the education program is expired " +
      "or invalid offering intensity " +
      "or an application change request is already in progress " +
      "or application is not in the correct status to be submitted " +
      "or change request has a different offering from its original submission" +
      "or change request has a different location from its original submission " +
      "or the application is archived and cannot be used to create a change request " +
      "or dynamic form configuration not found.",
  })
  @ApiBadRequestResponse({
    description:
      "Form validation failed or offering intensity type is invalid.",
  })
  @ApiNotFoundResponse({
    description:
      "Application not found or it is not in the correct status to be changed.",
  })
  @ApiForbiddenResponse({
    description: "The student has a restriction on his account.",
  })
  async applicationChangeRequest(
    @Body() payload: SaveApplicationAPIInDTO,
    @Param("applicationId", ParseIntPipe) applicationId: number,
    @UserToken() studentToken: StudentUserToken,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    const validatedResult =
      await this.applicationControllerService.validateApplicationSubmission(
        applicationId,
        studentToken.studentId,
        payload,
        { isChangeRequestSubmission: true },
      );
    try {
      const submissionResult =
        await this.applicationService.submitApplicationChangeRequest(
          applicationId,
          studentToken.studentId,
          validatedResult,
          payload.associatedFiles,
          studentToken.userId,
        );
      return {
        id: submissionResult.application.id,
      };
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        switch (error.name) {
          case APPLICATION_NOT_FOUND:
            throw new NotFoundException(error.message);
          case APPLICATION_NOT_VALID:
            throw new UnprocessableEntityException(error.message);
          case APPLICATION_CHANGE_REQUEST_ALREADY_IN_PROGRESS:
            throw new UnprocessableEntityException(
              new ApiProcessError(error.message, error.name),
            );
        }
      }
      throw error;
    }
  }

  /**
   * Cancels an in-progress change request for an existing student application.
   * @param applicationId application ID of the change request to be cancelled.
   */
  @Patch(":applicationId/cancel-change-request")
  @ApiNotFoundResponse({
    description: "Not able to find the in-progress change request.",
  })
  async applicationCancelChangeRequest(
    @Param("applicationId", ParseIntPipe) applicationId: number,
    @UserToken() studentToken: StudentUserToken,
  ): Promise<void> {
    try {
      await this.applicationService.cancelApplicationChangeRequest(
        applicationId,
        studentToken.studentId,
        studentToken.userId,
      );
    } catch (error: unknown) {
      if (
        error instanceof CustomNamedError &&
        error.name === APPLICATION_NOT_FOUND
      ) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  /**
   * Creates a new application draft for the authenticated student.
   * The student is allowed to have only one draft application, so
   * this method will create the draft or throw an exception in case
   * of the draft already exists.
   * @param payload payload to create the draft application.
   * @param studentToken token from the authenticated student.
   * @returns the application id of the created draft or an
   * HTTP exception if it is not possible to create it.
   */
  @CheckSinValidation()
  @ApiUnprocessableEntityResponse({
    description:
      "Program Year is not active or MORE_THAN_ONE_APPLICATION_DRAFT_ERROR " +
      "or Invalid offering intensity",
  })
  @ApiBadRequestResponse({
    description: "Offering intensity type is invalid",
  })
  @Post("draft")
  async createDraftApplication(
    @Body() payload: CreateApplicationAPIInDTO,
    @UserToken() studentToken: StudentUserToken,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    const programYear = await this.programYearService.getActiveProgramYear(
      payload.programYearId,
    );
    if (!programYear) {
      throw new UnprocessableEntityException(
        "Program Year is not active, not able to create a draft application.",
      );
    }
    // The check to validate the value of offeringIntensity can be removed once the toggle for IS_FULL_TIME_ALLOWED is no longer needed
    // and the types are hard-coded again in the form.io definition using the onlyAvailableItems as true.
    if (payload.offeringIntensity === OfferingIntensity.fullTime) {
      // Checking executed based on the token information since only BCSC users are expected to have
      // beta full-time access and the token information and DB will be in sync.
      await this.applicationControllerService.validateFullTimeAccess(
        studentToken.lastName,
        studentToken.givenNames,
      );
    }
    try {
      const draftApplication =
        await this.applicationService.saveDraftApplication(
          studentToken.studentId,
          studentToken.userId,
          payload.programYearId,
          payload.data,
          payload.associatedFiles,
          { offeringIntensity: payload.offeringIntensity },
        );
      return { id: draftApplication.id };
    } catch (error) {
      if (error.name === MORE_THAN_ONE_APPLICATION_DRAFT_ERROR) {
        throw new UnprocessableEntityException(
          new ApiProcessError(error.message, error.name),
        );
      }
      throw new InternalServerErrorException(
        "Unexpected error while creating the draft application.",
      );
    }
  }

  /**
   * Updates an existing application draft
   * @param payload payload to update the draft application.
   * @param applicationId draft application id.
   * @param studentToken token from the authenticated student.
   */
  @CheckSinValidation()
  @Patch(":applicationId/draft")
  @ApiUnprocessableEntityResponse({
    description: "Invalid offering intensity",
  })
  @ApiBadRequestResponse({
    description: "Offering intensity type is invalid",
  })
  @ApiNotFoundResponse({ description: "APPLICATION_DRAFT_NOT_FOUND." })
  async updateDraftApplication(
    @Body() payload: SaveApplicationAPIInDTO,
    @Param("applicationId", ParseIntPipe) applicationId: number,
    @UserToken() studentToken: StudentUserToken,
  ): Promise<void> {
    const isFulltimeAllowed = this.configService.isFulltimeAllowed;
    const { offeringIntensity } =
      await this.applicationService.getApplicationInfo(applicationId);
    // The check to validate the value of offeringIntensity can be removed once the toggle for IS_FULL_TIME_ALLOWED is no longer needed
    // and the types are hard-coded again in the form.io definition using the onlyAvailableItems as true.
    if (
      !isFulltimeAllowed &&
      offeringIntensity === OfferingIntensity.fullTime
    ) {
      throw new UnprocessableEntityException("Invalid offering intensity.");
    }
    try {
      await this.applicationService.saveDraftApplication(
        studentToken.studentId,
        studentToken.userId,
        payload.programYearId,
        payload.data,
        payload.associatedFiles,
        { applicationId },
      );
    } catch (error) {
      if (error.name === APPLICATION_DRAFT_NOT_FOUND) {
        throw new NotFoundException(error);
      }
      throw new InternalServerErrorException(
        "Unexpected error while updating the draft application.",
      );
    }
  }

  /**
   * Cancel a student application.
   * @param applicationId application id to be cancelled.
   */
  @ApiUnprocessableEntityResponse({
    description:
      "Application not found or it is not in the correct state to be cancelled.",
  })
  @Patch(":applicationId/cancel")
  async cancelStudentApplication(
    @UserToken() userToken: StudentUserToken,
    @Param("applicationId", ParseIntPipe) applicationId: number,
  ): Promise<void> {
    try {
      await this.applicationService.cancelStudentApplication(
        applicationId,
        userToken.studentId,
        userToken.userId,
      );
    } catch (error: unknown) {
      if (
        error instanceof CustomNamedError &&
        error.name === APPLICATION_NOT_FOUND
      ) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  /**
   * Get program year details for the application.
   * @param applicationId application id to be updated.
   * @query includeInActivePY, if includeInActivePY is true,
   * then consider both active and inactive program year.
   * @returns program year details of the application
   */
  @ApiNotFoundResponse({ description: "Student not found." })
  @Get(":applicationId/program-year")
  async programYearOfApplication(
    @UserToken() userToken: IUserToken,
    @Param("applicationId", ParseIntPipe) applicationId: number,
    @Query("includeInActivePY", new DefaultValuePipe(false), ParseBoolPipe)
    includeInActivePY: boolean,
  ): Promise<ApplicationWithProgramYearAPIOutDTO> {
    const student = await this.studentService.getStudentByUserId(
      userToken.userId,
    );

    if (!student) {
      throw new NotFoundException("The user is not associated with a student.");
    }

    const applicationProgramYear =
      await this.applicationService.getProgramYearOfApplication(
        student.id,
        applicationId,
        includeInActivePY,
      );
    const formName =
      this.applicationControllerService.getStudentApplicationFormName(
        applicationProgramYear.programYear.id,
        applicationProgramYear.offeringIntensity,
      );
    return {
      applicationId: applicationId,
      programYearId: applicationProgramYear.programYear.id,
      formName,
      active: applicationProgramYear.programYear.active,
    };
  }

  /**
   * Get application to request an appeal.
   * @param applicationId application ID.
   * @returns application eligible to be requested for a change.
   */
  @ApiNotFoundResponse({
    description:
      "Application either not found or not eligible to request for change.",
  })
  @Get(":applicationId/appeal")
  async getApplicationToRequestAppeal(
    @Param("applicationId", ParseIntPipe) applicationId: number,
    @UserToken() userToken: IUserToken,
  ): Promise<ApplicationProgramYearAPIOutDTO> {
    const application =
      await this.applicationService.getApplicationToRequestAppeal(
        applicationId,
        userToken.userId,
      );
    if (!application) {
      throw new NotFoundException(
        "Given application either does not exist or is not complete to request change.",
      );
    }
    return {
      id: application.id,
      applicationNumber: application.applicationNumber,
      programYear: application.programYear.programYear,
    };
  }

  /**
   * Get in progress details of an application by application id.
   * @param applicationId application id.
   * @returns application details.
   */
  @Get(":applicationId/in-progress")
  @ApiNotFoundResponse({
    description: "Application id not found.",
  })
  @ApiUnprocessableEntityResponse({
    description: `Application not in ${ApplicationStatus.InProgress} status.`,
  })
  async getInProgressApplicationDetails(
    @Param("applicationId", ParseIntPipe) applicationId: number,
    @UserToken() studentToken: StudentUserToken,
  ): Promise<InProgressApplicationDetailsAPIOutDTO> {
    return this.applicationControllerService.getInProgressApplicationDetails(
      applicationId,
      { studentId: studentToken.studentId },
    );
  }

  /**
   * Get status of all requests and confirmations in student application (Exception, PIR and COE).
   * @param applicationId Student application.
   * @returns application progress details.
   */
  @ApiNotFoundResponse({
    description: "Application not found.",
  })
  @Get(":applicationId/progress-details")
  async getApplicationProgressDetails(
    @Param("applicationId", ParseIntPipe) applicationId: number,
    @UserToken() userToken: StudentUserToken,
  ): Promise<ApplicationProgressDetailsAPIOutDTO> {
    return this.applicationControllerService.getApplicationProgressDetails(
      applicationId,
      { studentId: userToken.studentId },
    );
  }

  /**
   * Get details for the application enrolment status of a student application.
   * @param applicationId student application id.
   * @returns details for the application enrolment status.
   */
  @ApiNotFoundResponse({
    description:
      "Application not found or not in relevant status to get enrolment details.",
  })
  @Get(":applicationId/enrolment")
  async getEnrolmentApplicationDetails(
    @Param("applicationId", ParseIntPipe) applicationId: number,
    @UserToken() userToken: StudentUserToken,
  ): Promise<EnrolmentApplicationDetailsAPIOutDTO> {
    return this.applicationControllerService.getEnrolmentApplicationDetails(
      applicationId,
      { studentId: userToken.studentId },
    );
  }

  /**
   * Get details for an application at completed status.
   * @param applicationId application id.
   * @returns details for an application on at completed status.
   */
  @ApiNotFoundResponse({
    description: `Application not found or not on ${ApplicationStatus.Completed} status.`,
  })
  @Get(":applicationId/completed")
  async getCompletedApplicationDetails(
    @Param("applicationId", ParseIntPipe) applicationId: number,
    @UserToken() userToken: StudentUserToken,
  ): Promise<CompletedApplicationDetailsAPIOutDTO> {
    return this.applicationControllerService.getCompletedApplicationDetails(
      applicationId,
      {
        studentId: userToken.studentId,
      },
    );
  }

  /**
   * Get application overall details for the given application.
   * @param applicationId application Id.
   * @returns application overall details.
   */
  @ApiNotFoundResponse({
    description: "Application not found.",
  })
  @Get(":applicationId/overall-details")
  async getApplicationOverallDetails(
    @Param("applicationId", ParseIntPipe) applicationId: number,
    @UserToken() userToken: StudentUserToken,
  ): Promise<ApplicationOverallDetailsAPIOutDTO> {
    return this.applicationControllerService.getApplicationOverallDetails(
      applicationId,
      { studentId: userToken.studentId },
    );
  }
}
