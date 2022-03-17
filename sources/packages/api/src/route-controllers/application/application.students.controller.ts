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
  HttpStatus,
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
  SFASApplicationService,
  SFASPartTimeApplicationsService,
  ConfigService,
  DisbursementScheduleService,
  InstitutionLocationService,
  EducationProgramService,
  StudentAssessmentService,
  INVALID_OPERATION_IN_THE_CURRENT_STATUS,
  ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE,
} from "../../services";
import { IUserToken } from "../../auth/userToken.interface";
import BaseController from "../BaseController";
import {
  SaveApplicationDto,
  GetApplicationDataDto,
  ApplicationStatusToBeUpdatedDto,
  ApplicationWithProgramYearDto,
  NOAApplicationDto,
  transformToApplicationDetailDto,
  ApplicationFormData,
} from "./models/application.model";
import {
  AllowAuthorizedParty,
  UserToken,
  CheckRestrictions,
  CheckSinValidation,
} from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { ApplicationStatus, Student } from "../../database/entities";
import { ApiProcessError, IConfig } from "../../types";
import {
  dateString,
  getUserFullName,
  checkStudyStartDateWithinProgramYear,
  checkNotValidStudyPeriod,
  PIR_OR_DATE_OVERLAP_ERROR,
  PIR_OR_DATE_OVERLAP_ERROR_MESSAGE,
  getOfferingNameAndPeriod,
} from "../../utilities";
import {
  INVALID_STUDY_DATES,
  OFFERING_START_DATE_ERROR,
} from "../../constants";
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { ApprovalStatus } from "../../services/education-program/constants";

@AllowAuthorizedParty(AuthorizedParties.student)
@Controller("application")
@ApiTags("application")
export class ApplicationStudentsController extends BaseController {
  private readonly config: IConfig;
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly formService: FormService,
    private readonly workflowService: WorkflowActionsService,
    private readonly studentService: StudentService,
    private readonly programYearService: ProgramYearService,
    private readonly offeringService: EducationProgramOfferingService,
    private readonly sfasApplicationService: SFASApplicationService,
    private readonly sfasPartTimeApplicationsService: SFASPartTimeApplicationsService,
    private readonly configService: ConfigService,
    private readonly disbursementScheduleService: DisbursementScheduleService,
    private readonly locationService: InstitutionLocationService,
    private readonly programService: EducationProgramService,
    private readonly assessmentService: StudentAssessmentService,
  ) {
    super();
    this.config = this.configService.getConfig();
  }

  @Get(":id")
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Application found.",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
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
    const additionalFormData = {} as ApplicationFormData;
    // Check wether the selected location is designated or not.
    // If selected location is not designated, then make the
    // selectedLocation null
    if (application.data?.selectedLocation) {
      const designatedLocation =
        await this.locationService.getDesignatedLocationById(
          application.data.selectedLocation,
        );
      const selectedLocation = await this.locationService.getLocationById(
        application.data.selectedLocation,
      );
      if (!designatedLocation) application.data.selectedLocation = null;
      // Assign location name for readonly form
      additionalFormData.selectedLocationName = selectedLocation?.name;
    }
    // Check wether the program is approved or not.
    // If selected program is not approved, then make the
    // selectedLocation null
    if (application.data?.selectedProgram) {
      const selectedProgram = await this.programService.getProgramById(
        application.data.selectedProgram,
      );

      if (selectedProgram) {
        // Assign program name for readonly form
        additionalFormData.selectedProgramName = selectedProgram.name;
        if (selectedProgram.approvalStatus !== ApprovalStatus.approved)
          application.data.selectedProgram = null;
      } else application.data.selectedProgram = null;
    }
    // Get selected offering details.
    if (application.data?.selectedOffering) {
      const selectedOffering = await this.offeringService.getOfferingById(
        application.data.selectedOffering,
      );
      if (selectedOffering)
        additionalFormData.selectedOfferingName =
          getOfferingNameAndPeriod(selectedOffering);
      else application.data.selectedOffering = null;
    }

    const firstCOE =
      await this.disbursementScheduleService.getFirstCOEOfApplication(
        applicationId,
      );
    return transformToApplicationDetailDto(
      application,
      additionalFormData,
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
  @ApiOkResponse({ description: "Application submitted" })
  @ApiUnprocessableEntityResponse({
    description:
      "Program Year is not active. OR  Invalid study dates. OR \
      Selected study start date is not within the program year. \
      OR APPLICATION_NOT_VALID. OR INVALID_OPERATION_IN_THE_CURRENT_STATUS. \
      OR ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE",
  })
  @ApiBadRequestResponse({ description: "Form validation failed" })
  @ApiNotFoundResponse({ description: "Application not found." })
  @ApiInternalServerErrorResponse({ description: "Unexpected error" })
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
          `${INVALID_STUDY_DATES} ${notValidDates}`,
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

    await this.validateOverlappingDatesAndPIR(
      applicationId,
      userToken,
      student,
      studyStartDate,
      studyEndDate,
    );
    try {
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
      "Program Year is not active. OR MORE_THAN_ONE_APPLICATION_DRAFT_ERROR.",
  })
  @ApiInternalServerErrorResponse({ description: "Unexpected error." })
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
  @ApiInternalServerErrorResponse({ description: "Unexpected error." })
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
  @Get(":applicationId/assessment")
  @ApiOkResponse({ description: "Retrieved assessment values." })
  @ApiNotFoundResponse({
    description:
      "Application id not found. OR Assessment for the application is not calculated.",
  })
  async getAssessmentInApplication(
    @Param("applicationId") applicationId: number,
    @UserToken() userToken: IUserToken,
  ): Promise<NOAApplicationDto> {
    const student = await this.studentService.getStudentByUserId(
      userToken.userId,
    );
    const application =
      await this.applicationService.getAssessmentByApplicationId(
        applicationId,
        student.id,
      );
    if (!application) {
      throw new NotFoundException(
        `Application id ${applicationId} was not found.`,
      );
    }
    if (!application.assessment) {
      throw new NotFoundException(
        `Assessment for the application id ${applicationId} was not calculated.`,
      );
    }
    //Disbursement data is populated with dynamic key in a defined pattern to be compatible with form table.
    const disbursementDetails = {};
    application.disbursementSchedules.forEach((schedule, index) => {
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
      assessment: application.assessment,
      applicationNumber: application.applicationNumber,
      fullName: getUserFullName(application.student.user),
      programName: application.offering.educationProgram.name,
      locationName: application.location.name,
      offeringIntensity: application.offering.offeringIntensity,
      offeringStudyStartDate: dateString(application.offering.studyStartDate),
      offeringStudyEndDate: dateString(application.offering.studyEndDate),
      msfaaNumber: application.msfaaNumber.msfaaNumber,
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
    description: "Student not found. OR Assessment confirmation failed.",
  })
  @Patch(":applicationId/confirm-assessment")
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

    const updateResult = await this.applicationService.studentConfirmAssessment(
      applicationId,
      student.id,
    );
    if (updateResult.affected === 0) {
      throw new UnprocessableEntityException(
        `Confirmation of Assessment for the application id ${applicationId} failed.`,
      );
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
    // delete workflow if the payload status is cancelled
    // workflow doest not exists for draft application
    if (
      payload &&
      ApplicationStatus.cancelled === payload.applicationStatus &&
      ApplicationStatus.draft !== studentApplication.applicationStatus &&
      studentApplication.assessmentWorkflowId
    ) {
      // Calling the API to stop assessment process
      await this.workflowService.deleteApplicationAssessment(
        studentApplication.assessmentWorkflowId,
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
   * Validation for application overlapping dates or Pending PIR.
   * This validation can be disabled by setting BYPASS_APPLICATION_SUBMIT_VALIDATIONS to true in .env file.
   * @param applicationId
   * @param userToken
   * @param student
   * @param studyStartDate
   * @param studyEndDate
   */
  private async validateOverlappingDatesAndPIR(
    applicationId: number,
    userToken: IUserToken,
    student: Student,
    studyStartDate: Date,
    studyEndDate: Date,
  ): Promise<void> {
    if (!this.config.bypassApplicationSubmitValidations) {
      const existingOverlapApplication =
        this.applicationService.validatePIRAndDateOverlap(
          userToken.userId,
          new Date(studyStartDate),
          new Date(studyEndDate),
          applicationId,
        );

      const existingSFASFTApplication =
        this.sfasApplicationService.validateDateOverlap(
          student.sin,
          student.birthDate,
          userToken.lastName,
          new Date(studyStartDate),
          new Date(studyEndDate),
        );

      const existingSFASPTApplication =
        this.sfasPartTimeApplicationsService.validateDateOverlap(
          student.sin,
          student.birthDate,
          userToken.lastName,
          new Date(studyStartDate),
          new Date(studyEndDate),
        );
      const [
        applicationResponse,
        sfasFTApplicationResponse,
        sfasPTApplicationResponse,
      ] = await Promise.all([
        existingOverlapApplication,
        existingSFASFTApplication,
        existingSFASPTApplication,
      ]);
      if (
        !!applicationResponse ||
        !!sfasFTApplicationResponse ||
        !!sfasPTApplicationResponse
      ) {
        throw new UnprocessableEntityException(
          `${PIR_OR_DATE_OVERLAP_ERROR} ${PIR_OR_DATE_OVERLAP_ERROR_MESSAGE}`,
        );
      }
    }
  }
}
