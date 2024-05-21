import {
  BadRequestException,
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
  FormService,
  StudentService,
  ProgramYearService,
  APPLICATION_DRAFT_NOT_FOUND,
  MORE_THAN_ONE_APPLICATION_DRAFT_ERROR,
  APPLICATION_NOT_FOUND,
  APPLICATION_NOT_VALID,
  EducationProgramOfferingService,
  INVALID_OPERATION_IN_THE_CURRENT_STATUS,
  ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE,
  CRAIncomeVerificationService,
  SupportingUserService,
  StudentAppealService,
  ApplicationOfferingChangeRequestService,
  EducationProgramService,
  StudentRestrictionService,
} from "../../services";
import { IUserToken, StudentUserToken } from "../../auth/userToken.interface";
import BaseController from "../BaseController";
import {
  SaveApplicationAPIInDTO,
  ApplicationDataAPIOutDTO,
  ApplicationWithProgramYearAPIOutDTO,
  ApplicationProgramYearAPIOutDTO,
  ApplicationNumberParamAPIInDTO,
  InProgressApplicationDetailsAPIOutDTO,
  ApplicationProgressDetailsAPIOutDTO,
  EnrolmentApplicationDetailsAPIOutDTO,
  CompletedApplicationDetailsAPIOutDTO,
  SuccessWaitingStatus,
} from "./models/application.dto";
import {
  AllowAuthorizedParty,
  UserToken,
  CheckSinValidation,
  RequiresStudentAccount,
} from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { ApiProcessError, ClientTypeBaseRoute } from "../../types";
import { getPIRDeniedReason, STUDY_DATE_OVERLAP_ERROR } from "../../utilities";
import {
  INSTITUTION_LOCATION_NOT_VALID,
  INVALID_APPLICATION_NUMBER,
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
import { ApplicationData } from "@sims/sims-db/entities/application.model";
import {
  ApplicationOfferingChangeRequestStatus,
  ApplicationStatus,
  DisabilityStatus,
  OfferingIntensity,
  RestrictionActionType,
  StudentAppealStatus,
} from "@sims/sims-db";
import {
  AssessmentSequentialProcessingService,
  ConfirmationOfEnrollmentService,
} from "@sims/services";
import { ConfigService } from "@sims/utilities/config";

@AllowAuthorizedParty(AuthorizedParties.student)
@RequiresStudentAccount()
@Controller("application")
@ApiTags(`${ClientTypeBaseRoute.Student}-application`)
export class ApplicationStudentsController extends BaseController {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly formService: FormService,
    private readonly studentService: StudentService,
    private readonly programYearService: ProgramYearService,
    private readonly educationProgramService: EducationProgramService,
    private readonly offeringService: EducationProgramOfferingService,
    private readonly confirmationOfEnrollmentService: ConfirmationOfEnrollmentService,
    private readonly applicationControllerService: ApplicationControllerService,
    private readonly craIncomeVerificationService: CRAIncomeVerificationService,
    private readonly supportingUserService: SupportingUserService,
    private readonly studentAppealService: StudentAppealService,
    private readonly applicationOfferingChangeRequestService: ApplicationOfferingChangeRequestService,
    private readonly configService: ConfigService,
    private readonly assessmentSequentialProcessingService: AssessmentSequentialProcessingService,
    private readonly studentRestrictionService: StudentRestrictionService,
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
      { loadDynamicData: true, studentId: userToken.studentId },
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
   * Validate the values in the submitted application before submitting.
   * @param payload payload to create the application.
   */
  private async validateSubmitApplicationData(
    payload: SaveApplicationAPIInDTO,
  ): Promise<void> {
    const isFulltimeAllowed = this.configService.isFulltimeAllowed;

    // The check to validate the values for howWillYouBeAttendingTheProgram can be removed once the toggle for IS_FULL_TIME_ALLOWED is no longer needed
    // and the types are hard-coded again in the form.io definition using the onlyAvailableItems as true.
    if (
      ![OfferingIntensity.fullTime, OfferingIntensity.partTime].includes(
        payload.data.howWillYouBeAttendingTheProgram,
      )
    ) {
      throw new BadRequestException("Offering intensity type is invalid.");
    }
    if (
      !isFulltimeAllowed &&
      payload.data.howWillYouBeAttendingTheProgram ===
        OfferingIntensity.fullTime
    ) {
      throw new UnprocessableEntityException("Invalid offering intensity.");
    }
    if (payload.data.selectedProgram) {
      const isProgramActive =
        await this.educationProgramService.isProgramActive(
          payload.data.selectedProgram,
        );
      if (!isProgramActive) {
        throw new UnprocessableEntityException(
          "Education Program not found or is not active. Not able to submit application due to invalid request.",
        );
      }
    }

    // studyStartDate from payload is set as studyStartDate
    let studyStartDate = payload.data.studystartDate;
    let studyEndDate = payload.data.studyendDate;
    if (payload.data.selectedOffering) {
      const offering = await this.offeringService.getOfferingById(
        payload.data.selectedOffering,
        payload.data.selectedProgram,
      );
      if (!offering) {
        throw new UnprocessableEntityException(
          "Selected offering id is invalid.",
        );
      }
      if (
        !isFulltimeAllowed &&
        offering.offeringIntensity === OfferingIntensity.fullTime
      ) {
        throw new UnprocessableEntityException("Invalid offering intensity.");
      }

      // if  studyStartDate is not in payload
      // then selectedOffering will be there in payload,
      // then study start date taken from offering
      studyStartDate = offering.studyStartDate;
      studyEndDate = offering.studyEndDate;
      // This ensures that if an offering is selected in student application,
      // then the study start date and study end date present in form submission payload
      // belongs to the selected offering and hence prevents these dates being modified in the
      // middle before coming to API.
      payload.data.selectedOfferingDate = studyStartDate;
      payload.data.selectedOfferingEndDate = studyEndDate;
    }
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
      "Education Program is not active. Not able to create an application invalid request " +
      "or APPLICATION_NOT_VALID or INVALID_OPERATION_IN_THE_CURRENT_STATUS or ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE " +
      "or INSTITUTION_LOCATION_NOT_VALID or OFFERING_NOT_VALID " +
      "or Invalid offering intensity",
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
    const programYear = await this.programYearService.getActiveProgramYear(
      payload.programYearId,
    );
    if (!programYear) {
      throw new UnprocessableEntityException(
        "Program Year is not active. Not able to create an application invalid request.",
      );
    }
    // Validate the values in the submitted application before submitting.
    await this.validateSubmitApplicationData(payload);

    const submissionResult =
      await this.formService.dryRunSubmission<ApplicationData>(
        programYear.formName,
        payload.data,
      );
    if (!submissionResult.valid) {
      throw new BadRequestException(
        "Not able to create an application due to an invalid request.",
      );
    }

    await this.applicationControllerService.offeringIntensityRestrictionCheck(
      studentToken.studentId,
      submissionResult.data.data.howWillYouBeAttendingTheProgram,
    );

    const student = await this.studentService.getStudentById(
      studentToken.studentId,
    );
    try {
      await this.applicationService.validateOverlappingDates(
        applicationId,
        student.user.lastName,
        studentToken.userId,
        student.sinValidation.sin,
        student.birthDate,
        payload.data.studystartDate,
        payload.data.studyendDate,
      );
      await this.applicationService.submitApplication(
        applicationId,
        studentToken.userId,
        student.id,
        programYear.id,
        submissionResult.data.data,
        payload.associatedFiles,
      );
    } catch (error) {
      switch (error.name) {
        case APPLICATION_NOT_FOUND:
          throw new NotFoundException(error.message);
        case APPLICATION_NOT_VALID:
        case INVALID_OPERATION_IN_THE_CURRENT_STATUS:
        case STUDY_DATE_OVERLAP_ERROR:
        case INSTITUTION_LOCATION_NOT_VALID:
        case OFFERING_NOT_VALID:
          throw new UnprocessableEntityException(
            new ApiProcessError(error.message, error.name),
          );
        case ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE:
          throw new UnprocessableEntityException(error.message);
        default:
          // TODO: add logger.
          throw new InternalServerErrorException(
            "Unexpected error while submitting the application.",
          );
      }
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
    @Body() payload: SaveApplicationAPIInDTO,
    @UserToken() studentToken: StudentUserToken,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    const isFulltimeAllowed = this.configService.isFulltimeAllowed;
    const programYear = await this.programYearService.getActiveProgramYear(
      payload.programYearId,
    );
    // The check to validate the values for howWillYouBeAttendingTheProgram can be removed once the toggle for IS_FULL_TIME_ALLOWED is no longer needed
    // and the types are hard-coded again in the form.io definition using the onlyAvailableItems as true.
    if (
      payload.data.howWillYouBeAttendingTheProgram &&
      ![OfferingIntensity.fullTime, OfferingIntensity.partTime].includes(
        payload.data.howWillYouBeAttendingTheProgram,
      )
    ) {
      throw new BadRequestException("Offering intensity type is invalid.");
    }
    if (!programYear) {
      throw new UnprocessableEntityException(
        "Program Year is not active, not able to create a draft application.",
      );
    }
    if (
      !isFulltimeAllowed &&
      payload.data.howWillYouBeAttendingTheProgram ===
        OfferingIntensity.fullTime
    ) {
      throw new UnprocessableEntityException("Invalid offering intensity.");
    }
    try {
      const draftApplication =
        await this.applicationService.saveDraftApplication(
          studentToken.studentId,
          studentToken.userId,
          payload.programYearId,
          payload.data,
          payload.associatedFiles,
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
    // The check to validate the values for howWillYouBeAttendingTheProgram can be removed once the toggle for IS_FULL_TIME_ALLOWED is no longer needed
    // and the types are hard-coded again in the form.io definition using the onlyAvailableItems as true.
    if (
      payload.data.howWillYouBeAttendingTheProgram &&
      ![OfferingIntensity.fullTime, OfferingIntensity.partTime].includes(
        payload.data.howWillYouBeAttendingTheProgram,
      )
    ) {
      throw new BadRequestException("Offering intensity type is invalid.");
    }
    if (
      !isFulltimeAllowed &&
      payload.data.howWillYouBeAttendingTheProgram ===
        OfferingIntensity.fullTime
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
        applicationId,
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

    return {
      applicationId: applicationId,
      programYearId: applicationProgramYear.programYear.id,
      formName: applicationProgramYear.programYear.formName,
      active: applicationProgramYear.programYear.active,
    };
  }

  /**
   * Get application to request appeal.
   ** Application eligible to be requested for
   ** a change will be returned.
   * @param applicationNumber
   * @param userToken
   * @returns application
   */
  @ApiNotFoundResponse({
    description:
      "Application either not found or not eligible to request for change.",
  })
  @Get(":applicationNumber/appeal")
  async getApplicationToRequestAppeal(
    @Param() applicationNumberParam: ApplicationNumberParamAPIInDTO,
    @UserToken() userToken: IUserToken,
  ): Promise<ApplicationProgramYearAPIOutDTO> {
    const application =
      await this.applicationService.getApplicationToRequestAppeal(
        userToken.userId,
        applicationNumberParam.applicationNumber,
      );
    if (!application) {
      throw new NotFoundException(
        new ApiProcessError(
          "Given application either does not exist or is not complete to request change.",
          INVALID_APPLICATION_NUMBER,
        ),
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
  async getInProgressApplicationDetails(
    @Param("applicationId", ParseIntPipe) applicationId: number,
    @UserToken() studentToken: StudentUserToken,
  ): Promise<InProgressApplicationDetailsAPIOutDTO> {
    const application = await this.applicationService.getApplicationDetails(
      applicationId,
      studentToken.studentId,
    );
    if (!application) {
      throw new NotFoundException(
        `Application id ${applicationId} was not found.`,
      );
    }
    const incomeVerificationDetails =
      await this.craIncomeVerificationService.getAllIncomeVerificationsForAnApplication(
        applicationId,
      );
    const incomeVerification =
      this.applicationControllerService.processApplicationIncomeVerificationDetails(
        incomeVerificationDetails,
      );

    const supportingUserDetails =
      await this.supportingUserService.getSupportingUsersByApplicationId(
        applicationId,
      );

    const supportingUser =
      this.applicationControllerService.processApplicationSupportingUserDetails(
        supportingUserDetails,
      );

    // Get the first outstanding assessment waiting for calculation as per the sequence.
    const firstOutstandingStudentAssessment =
      await this.assessmentSequentialProcessingService.getOutstandingAssessmentsForStudentInSequence(
        studentToken.studentId,
        application.programYear.id,
      );

    // If first outstanding assessment returns a value and its Id is different
    // from the current assessment Id, then assessmentInCalculationStep is Waiting.
    const outstandingAssessmentStatus =
      firstOutstandingStudentAssessment &&
      firstOutstandingStudentAssessment.id !== application.currentAssessment.id
        ? SuccessWaitingStatus.Waiting
        : SuccessWaitingStatus.Success;

    return {
      id: application.id,
      applicationStatus: application.applicationStatus,
      pirStatus: application.pirStatus,
      pirDeniedReason: getPIRDeniedReason(application),
      exceptionStatus: application.applicationException?.exceptionStatus,
      outstandingAssessmentStatus: outstandingAssessmentStatus,
      ...incomeVerification,
      ...supportingUser,
    };
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
    const application = await this.applicationService.getApplicationDetails(
      applicationId,
      userToken.studentId,
    );
    if (!application) {
      throw new NotFoundException(
        `Application id ${applicationId} was not found.`,
      );
    }

    let appealStatus: StudentAppealStatus;
    let applicationOfferingChangeRequestStatus: ApplicationOfferingChangeRequestStatus;
    let hasBlockFundingFeedbackError = false;
    if (application.applicationStatus === ApplicationStatus.Completed) {
      const appealPromise = this.studentAppealService.getAppealsForApplication(
        applicationId,
        userToken.studentId,
        { limit: 1 },
      );
      const applicationOfferingChangeRequestPromise =
        this.applicationOfferingChangeRequestService.getApplicationOfferingChangeRequest(
          applicationId,
          userToken.studentId,
        );
      const feedbackErrorPromise =
        this.applicationService.hasFeedbackErrorBlockingFunds(applicationId);
      const [[appeal], applicationOfferingChangeRequest, feedbackError] =
        await Promise.all([
          appealPromise,
          applicationOfferingChangeRequestPromise,
          feedbackErrorPromise,
        ]);
      appealStatus = appeal?.status;
      applicationOfferingChangeRequestStatus =
        applicationOfferingChangeRequest?.applicationOfferingChangeRequestStatus;
      hasBlockFundingFeedbackError = feedbackError;
    }

    const assessmentTriggerType = application.currentAssessment?.triggerType;

    const disbursements =
      application.currentAssessment?.disbursementSchedules ?? [];

    disbursements.sort((a, b) =>
      a.disbursementDate < b.disbursementDate ? -1 : 1,
    );
    const [firstDisbursement, secondDisbursement] = disbursements;
    const [scholasticStandingChange] = application.studentScholasticStandings;
    return {
      applicationStatus: application.applicationStatus,
      applicationStatusUpdatedOn: application.applicationStatusUpdatedOn,
      pirStatus: application.pirStatus,
      firstCOEStatus: firstDisbursement?.coeStatus,
      secondCOEStatus: secondDisbursement?.coeStatus,
      exceptionStatus: application.applicationException?.exceptionStatus,
      appealStatus,
      scholasticStandingChangeType: scholasticStandingChange?.changeType,
      applicationOfferingChangeRequestStatus,
      assessmentTriggerType,
      hasBlockFundingFeedbackError,
    };
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
    const application =
      await this.applicationService.getApplicationAssessmentDetails(
        applicationId,
        { studentId: userToken.studentId },
      );
    if (!application) {
      throw new NotFoundException(
        `Application id ${applicationId} not found or not in relevant status to get enrolment details.`,
      );
    }

    // Verify Disability Status PD/PPD.
    const verifiedDisabilityStatus = application.currentAssessment.workflowData
      .calculatedData.pdppdStatus
      ? [(DisabilityStatus.PD, DisabilityStatus.PPD)].includes(
          application.student.disabilityStatus,
        )
      : true;

    // Verify MSFAA status which is signed OR cancelled.
    let hasSignature = true;
    let isNotCancelled = true;
    const disbursementSchedules =
      application.currentAssessment.disbursementSchedules;
    disbursementSchedules.forEach((disbursementSchedule) => {
      hasSignature =
        hasSignature && !!disbursementSchedule.msfaaNumber?.dateSigned;
      isNotCancelled =
        isNotCancelled && !disbursementSchedule.msfaaNumber?.cancelledDate;
    });
    const hasValidMSFAAStatus = hasSignature && isNotCancelled;

    // Get restriction records from the student restrictions.
    // Filter restrictions based on offering intensity.
    // Remove restrictions with duplicated restriction code.
    let hasRestriction = false;
    const studentRestrictions = application.student.studentRestrictions;
    if (studentRestrictions.length > 0) {
      // Filter restriction action type based on offering intensity.
      if (
        application.currentAssessment.offering.offeringIntensity ===
        OfferingIntensity.partTime
      ) {
        const filterStudentRestrictions = studentRestrictions.filter(
          (studentRestriction) =>
            studentRestriction.restriction.actionType.includes(
              RestrictionActionType.StopPartTimeDisbursement,
            ),
        );
        hasRestriction = filterStudentRestrictions.length > 0;
      }
    }

    return {
      ...this.applicationControllerService.transformToEnrolmentApplicationDetailsAPIOutDTO(
        application.currentAssessment.disbursementSchedules,
      ),
      assessmentTriggerType: application.currentAssessment.triggerType,
      verifiedDisabilityStatus,
      hasValidMSFAAStatus,
      hasRestriction,
    };
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
    const getApplicationPromise =
      this.applicationService.getApplicationAssessmentDetails(applicationId, {
        studentId: userToken.studentId,
        applicationStatus: [ApplicationStatus.Completed],
      });
    const appealPromise = this.studentAppealService.getAppealsForApplication(
      applicationId,
      userToken.studentId,
      { limit: 1 },
    );
    const applicationOfferingChangeRequestPromise =
      this.applicationOfferingChangeRequestService.getApplicationOfferingChangeRequest(
        applicationId,
        userToken.studentId,
      );
    const hasBlockFundingFeedbackErrorPromise =
      this.applicationService.hasFeedbackErrorBlockingFunds(applicationId);
    const [
      application,
      [appeal],
      applicationOfferingChangeRequest,
      hasBlockFundingFeedbackError,
    ] = await Promise.all([
      getApplicationPromise,
      appealPromise,
      applicationOfferingChangeRequestPromise,
      hasBlockFundingFeedbackErrorPromise,
    ]);
    if (!application) {
      throw new NotFoundException(
        `Application not found or not on ${ApplicationStatus.Completed} status.`,
      );
    }
    const enrolmentDetails =
      this.applicationControllerService.transformToEnrolmentApplicationDetailsAPIOutDTO(
        application.currentAssessment.disbursementSchedules,
      );
    const [scholasticStandingChange] = application.studentScholasticStandings;
    return {
      firstDisbursement: enrolmentDetails.firstDisbursement,
      secondDisbursement: enrolmentDetails.secondDisbursement,
      assessmentTriggerType: application.currentAssessment.triggerType,
      appealStatus: appeal?.status,
      scholasticStandingChangeType: scholasticStandingChange?.changeType,
      applicationOfferingChangeRequestId: applicationOfferingChangeRequest?.id,
      applicationOfferingChangeRequestStatus:
        applicationOfferingChangeRequest?.applicationOfferingChangeRequestStatus,
      hasBlockFundingFeedbackError,
    };
  }
}
