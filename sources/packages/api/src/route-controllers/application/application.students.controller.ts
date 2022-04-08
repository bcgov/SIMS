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
} from "@nestjs/common";
import {
  ApplicationService,
  FormService,
  StudentService,
  WorkflowActionsService,
  ProgramYearService,
  APPLICATION_DRAFT_NOT_FOUND,
  MORE_THAN_ONE_APPLICATION_DRAFT_ERROR,
  APPLICATION_NOT_FOUND,
  APPLICATION_NOT_VALID,
  EducationProgramOfferingService,
  DisbursementScheduleService,
  StudentAssessmentService,
  INVALID_OPERATION_IN_THE_CURRENT_STATUS,
  ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE,
  ASSESSMENT_NOT_FOUND,
  APPLICATION_DATE_OVERLAP_ERROR,
} from "../../services";
import { IUserToken } from "../../auth/userToken.interface";
import BaseController from "../BaseController";
import {
  SaveApplicationDto,
  GetApplicationDataDto,
  ApplicationStatusToBeUpdatedDto,
  ApplicationWithProgramYearDto,
  NOAApplicationDto,
  ApplicationIdentifiersDTO,
} from "./models/application.model";
import {
  AllowAuthorizedParty,
  UserToken,
  CheckRestrictions,
  CheckSinValidation,
} from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { ApiProcessError, ClientTypeBaseRoute } from "../../types";
import {
  ApplicationStatus,
  AssessmentTriggerType,
} from "../../database/entities";
import {
  dateString,
  getUserFullName,
  checkStudyStartDateWithinProgramYear,
  checkNotValidStudyPeriod,
} from "../../utilities";
import {
  INVALID_STUDY_DATES,
  OFFERING_START_DATE_ERROR,
  INVALID_APPLICATION_NUMBER,
} from "../../constants";
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { ApplicationControllerService } from "./application.controller.service";

@AllowAuthorizedParty(AuthorizedParties.student)
@Controller("application")
@ApiTags(`${ClientTypeBaseRoute.Student}-application`)
export class ApplicationStudentsController extends BaseController {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly formService: FormService,
    private readonly workflowService: WorkflowActionsService,
    private readonly studentService: StudentService,
    private readonly programYearService: ProgramYearService,
    private readonly offeringService: EducationProgramOfferingService,
    private readonly disbursementScheduleService: DisbursementScheduleService,
    private readonly assessmentService: StudentAssessmentService,
    private readonly applicationControllerService: ApplicationControllerService,
  ) {
    super();
  }

  @Get(":id")
  @ApiOkResponse({
    description: "Application found.",
  })
  @ApiNotFoundResponse({
    description: "Application id not found.",
  })
  async getByApplicationId(
    @Param("id") applicationId: number,
    @UserToken() userToken: IUserToken,
  ): Promise<GetApplicationDataDto> {
    const application = await this.applicationService.getApplicationByIdAndUser(
      applicationId,
      userToken.userId,
    );
    if (!application) {
      throw new NotFoundException(
        `Application id ${applicationId} was not found.`,
      );
    }

    application.data =
      await this.applicationControllerService.generateApplicationFormData(
        application.data,
      );

    const firstCOE =
      await this.disbursementScheduleService.getFirstCOEOfApplication(
        applicationId,
      );
    return this.applicationControllerService.transformToApplicationDetailForStudentDTO(
      application,
      firstCOE,
    );
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
   * @param userToken token from the authenticated student.
   */
  @CheckSinValidation()
  @CheckRestrictions()
  @Patch(":applicationId/submit")
  @ApiOkResponse({ description: "Application submitted." })
  @ApiUnprocessableEntityResponse({
    description:
      "Program Year is not active or invalid study dates or selected study start date is not within the program year or APPLICATION_NOT_VALID or INVALID_OPERATION_IN_THE_CURRENT_STATUS or ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE.",
  })
  @ApiBadRequestResponse({ description: "Form validation failed." })
  @ApiNotFoundResponse({ description: "Application not found." })
  async submitApplication(
    @Body() payload: SaveApplicationDto,
    @Param("applicationId") applicationId: number,
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    const programYear = await this.programYearService.getActiveProgramYear(
      payload.programYearId,
    );
    if (!programYear) {
      throw new UnprocessableEntityException(
        "Program Year is not active. Not able to create an application invalid request",
      );
    }

    const submissionResult = await this.formService.dryRunSubmission(
      programYear.formName,
      payload.data,
    );
    if (!submissionResult.valid) {
      throw new BadRequestException(
        "Not able to create an application due to an invalid request.",
      );
    }
    // studyStartDate from payload is set as studyStartDate
    let studyStartDate = payload.data.studystartDate;
    let studyEndDate = payload.data.studyendDate;
    if (payload.data.selectedOffering) {
      const offering = await this.offeringService.getOfferingById(
        payload.data.selectedOffering,
      );
      // if  studyStartDate is not in payload
      // then selectedOffering will be there in payload,
      // then study start date taken from offering
      studyStartDate = offering.studyStartDate;
      studyEndDate = offering.studyEndDate;
    } else {
      // when selectedOffering is not selected
      const notValidDates = checkNotValidStudyPeriod(
        payload.data.studystartDate,
        payload.data.studyendDate,
      );
      if (notValidDates) {
        throw new UnprocessableEntityException(
          new ApiProcessError(
            `${INVALID_STUDY_DATES} ${notValidDates}`,
            APPLICATION_DATE_OVERLAP_ERROR,
          ),
        );
      }
    }

    if (!checkStudyStartDateWithinProgramYear(studyStartDate, programYear)) {
      throw new UnprocessableEntityException(
        `${OFFERING_START_DATE_ERROR} study start date should be within the program year of the students application`,
      );
    }

    const student = await this.studentService.getStudentByUserId(
      userToken.userId,
    );

    try {
      await this.applicationService.validateOverlappingDatesAndPIR(
        applicationId,
        student.user.lastName,
        userToken.userId,
        student.sin,
        student.birthDate,
        studyStartDate,
        studyEndDate,
      );
      const { createdAssessment } =
        await this.applicationService.submitApplication(
          applicationId,
          userToken.userId,
          student.id,
          programYear.id,
          submissionResult.data.data,
          payload.associatedFiles,
        );
      await this.assessmentService.startAssessment(createdAssessment.id);
    } catch (error) {
      switch (error.name) {
        case APPLICATION_NOT_FOUND:
          throw new NotFoundException(error.message);
        case APPLICATION_NOT_VALID:
        case INVALID_OPERATION_IN_THE_CURRENT_STATUS:
        case APPLICATION_DATE_OVERLAP_ERROR:
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
   * @param userToken token from the authenticated student.
   * @returns the application id of the created draft or an
   * HTTP exception if it is not possible to create it.
   */
  @CheckSinValidation()
  @CheckRestrictions()
  @ApiOkResponse({ description: "Draft application created." })
  @ApiUnprocessableEntityResponse({
    description:
      "Program Year is not active or MORE_THAN_ONE_APPLICATION_DRAFT_ERROR.",
  })
  @Post("draft")
  async createDraftApplication(
    @Body() payload: SaveApplicationDto,
    @UserToken() userToken: IUserToken,
  ): Promise<number> {
    const programYear = await this.programYearService.getActiveProgramYear(
      payload.programYearId,
    );

    if (!programYear) {
      throw new UnprocessableEntityException(
        "Program Year is not active, not able to create a draft application.",
      );
    }

    const student = await this.studentService.getStudentByUserId(
      userToken.userId,
    );

    try {
      const draftApplication =
        await this.applicationService.saveDraftApplication(
          student.id,
          payload.programYearId,
          payload.data,
          payload.associatedFiles,
        );
      return draftApplication.id;
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
   * @param userToken token from the authenticated student.
   */
  @CheckSinValidation()
  @CheckRestrictions()
  @Patch(":applicationId/draft")
  @ApiOkResponse({ description: "Draft application updated." })
  @ApiNotFoundResponse({ description: "APPLICATION_DRAFT_NOT_FOUND." })
  async updateDraftApplication(
    @Body() payload: SaveApplicationDto,
    @Param("applicationId") applicationId: number,
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    const student = await this.studentService.getStudentByUserId(
      userToken.userId,
    );

    try {
      await this.applicationService.saveDraftApplication(
        student.id,
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
   * Fetch the NOA screen values for a student application.
   * @param applicationId application id to fetch the NOA values.
   * @param userToken associated student of the application.
   * @returns NOA and application data.
   */
  // TODO: Move this endpoint to a specific assessment controller and use the assessment id instead of the application id.
  @Get(":applicationId/assessment")
  @ApiOkResponse({ description: "Retrieved assessment values." })
  @ApiNotFoundResponse({
    description:
      "Application id not found or Assessment for the application is not calculated.",
  })
  async getAssessmentInApplication(
    @Param("applicationId") applicationId: number,
    @UserToken() userToken: IUserToken,
  ): Promise<NOAApplicationDto> {
    const student = await this.studentService.getStudentByUserId(
      userToken.userId,
    );

    // TODO: temporary code to allow the assessment to be retrieved using the application id.
    const [originalAssessment] =
      await this.assessmentService.getAssessmentsByApplicationId(
        applicationId,
        AssessmentTriggerType.OriginalAssessment,
      );
    // TODO: end of the temporary code that will be removed.

    const assessment = await this.assessmentService.getAssessmentForNOA(
      originalAssessment.id,
      student.id,
    );

    if (!assessment) {
      throw new NotFoundException(
        "Assessment was not found for the the student.",
      );
    }

    if (!assessment.assessmentData) {
      throw new NotFoundException(
        `Assessment for the application id ${applicationId} was not calculated.`,
      );
    }
    //Disbursement data is populated with dynamic key in a defined pattern to be compatible with form table.
    const disbursementDetails = {};
    assessment.disbursementSchedules.forEach((schedule, index) => {
      const disbursementIdentifier = `disbursement${index + 1}`;
      disbursementDetails[`${disbursementIdentifier}Date`] = dateString(
        schedule.disbursementDate,
      );
      schedule.disbursementValues.forEach((disbursement) => {
        const disbursementValueKey = `${disbursementIdentifier}${disbursement.valueCode.toLowerCase()}`;
        disbursementDetails[disbursementValueKey] = disbursement.valueAmount;
      });
    });

    return {
      assessment: assessment.assessmentData,
      applicationNumber: assessment.application.applicationNumber,
      fullName: getUserFullName(assessment.application.student.user),
      programName: assessment.offering.educationProgram.name,
      locationName: assessment.offering.institutionLocation.name,
      offeringIntensity: assessment.offering.offeringIntensity,
      offeringStudyStartDate: dateString(assessment.offering.studyStartDate),
      offeringStudyEndDate: dateString(assessment.offering.studyEndDate),
      msfaaNumber: assessment.application.msfaaNumber.msfaaNumber,
      disbursement: disbursementDetails,
    };
  }

  /**
   * Confirm Assessment of a Student.
   * @param applicationId application id to be updated.
   */
  @CheckRestrictions()
  @ApiOkResponse({ description: "Assessment confirmed." })
  @ApiUnprocessableEntityResponse({
    description: "Student not found or Assessment confirmation failed.",
  })
  @Patch(":applicationId/confirm-assessment")
  // TODO: Move this endpoint to a specific assessment controller and use the assessment id instead of the application id.
  async studentConfirmAssessment(
    @UserToken() userToken: IUserToken,
    @Param("applicationId") applicationId: number,
  ): Promise<void> {
    const student = await this.studentService.getStudentByUserId(
      userToken.userId,
    );

    if (!student) {
      throw new UnprocessableEntityException(
        "The user is not associated with a student.",
      );
    }

    // TODO: temporary code to allow the assessment to be retrieved using the application id.
    const [originalAssessment] =
      await this.assessmentService.getAssessmentsByApplicationId(
        applicationId,
        AssessmentTriggerType.OriginalAssessment,
      );
    // TODO: end of the temporary code that will be removed.

    try {
      await this.assessmentService.studentConfirmAssessment(
        originalAssessment.id,
        student.id,
      );
    } catch (error) {
      switch (error.name) {
        case ASSESSMENT_NOT_FOUND:
          throw new NotFoundException(error.message);
        case ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE:
          throw new UnprocessableEntityException(error.message);
        default:
          throw error;
      }
    }
  }

  /**
   * Generic method to update all Student Application status from frontend.
   * @param applicationId application id to be updated.
   * @body payload contains the status, that need to be updated
   */
  @ApiOkResponse({ description: "Student Application status updated." })
  @ApiNotFoundResponse({ description: "Application not found." })
  @ApiUnprocessableEntityResponse({
    description: "Application Status update failed.",
  })
  @Patch(":applicationId/status")
  async updateStudentApplicationStatus(
    @UserToken() userToken: IUserToken,
    @Param("applicationId") applicationId: number,
    @Body() payload: ApplicationStatusToBeUpdatedDto,
  ): Promise<void> {
    const studentApplication =
      await this.applicationService.getApplicationByIdAndUser(
        applicationId,
        userToken.userId,
      );

    if (!studentApplication) {
      throw new NotFoundException(
        `Application ${applicationId} associated with requested student does not exist.`,
      );
    }
    // Delete workflow if the payload status is cancelled.
    // Workflow doest not exists for draft or submitted application, for instance.
    if (
      payload?.applicationStatus === ApplicationStatus.cancelled &&
      studentApplication.currentAssessment?.assessmentWorkflowId
    ) {
      // Calling the API to stop assessment process
      await this.workflowService.deleteApplicationAssessment(
        studentApplication.currentAssessment.assessmentWorkflowId,
      );
    }
    // updating the application status
    const updateResult = await this.applicationService.updateApplicationStatus(
      studentApplication.id,
      payload.applicationStatus,
    );

    if (updateResult.affected === 0) {
      throw new UnprocessableEntityException(
        `Application Status update for Application ${applicationId} failed.`,
      );
    }
  }

  /**
   * Get program year details for the application.
   * @param applicationId application id to be updated.
   * @query includeInActivePY, if includeInActivePY is true,
   * then consider both active and inactive program year.
   * @returns program year details of the application
   */
  @ApiOkResponse({ description: "Program year details fetched." })
  @ApiNotFoundResponse({ description: "Student not found." })
  @Get(":applicationId/program-year")
  async programYearOfApplication(
    @UserToken() userToken: IUserToken,
    @Param("applicationId") applicationId: number,
    @Query("includeInActivePY") includeInActivePY?: boolean,
  ): Promise<ApplicationWithProgramYearDto> {
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
    } as ApplicationWithProgramYearDto;
  }

  /**
   * Get application to request appeal.
   ** Application eligible to be requested for
   ** a change will be returned.
   * @param applicationNumber
   * @param userToken
   * @returns application
   */
  @ApiOkResponse({
    description: "Returns application which can be requested for change.",
  })
  @ApiNotFoundResponse({
    description:
      "Application either not found or not eligible to request for change.",
  })
  @Get(":applicationNumber/appeal")
  async getApplicationToRequestAppeal(
    @Param("applicationNumber") applicationNumber: string,
    @UserToken() userToken: IUserToken,
  ): Promise<ApplicationIdentifiersDTO> {
    const application =
      await this.applicationService.getApplicationToRequestAppeal(
        userToken.userId,
        applicationNumber,
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
    };
  }
}
