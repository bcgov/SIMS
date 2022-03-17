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
  SFASApplicationService,
  SFASPartTimeApplicationsService,
  ConfigService,
  DisbursementScheduleService,
  StudentAssessmentService,
  INVALID_OPERATION_IN_THE_CURRENT_STATUS,
  ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE,
  ASSESSMENT_NOT_FOUND,
} from "../../services";
import { IUserToken } from "../../auth/userToken.interface";
import BaseController from "../BaseController";
import {
  SaveApplicationDto,
  GetApplicationDataDto,
  GetApplicationBaseDTO,
  ApplicationStatusToBeUpdatedDto,
  ApplicationWithProgramYearDto,
  NOAApplicationDto,
  transformToApplicationDto,
  transformToApplicationDetailDto,
  StudentApplicationAndCount,
} from "./models/application.model";
import {
  AllowAuthorizedParty,
  UserToken,
  CheckRestrictions,
  CheckSinValidation,
  Groups,
} from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { UserGroups } from "../../auth/user-groups.enum";
import {
  ApplicationStatus,
  Application,
  Student,
  AssessmentTriggerType,
} from "../../database/entities";
import { ApiProcessError, IConfig } from "../../types";
import {
  dateString,
  getUserFullName,
  FieldSortOrder,
  DEFAULT_PAGE_NUMBER,
  DEFAULT_PAGE_LIMIT,
  transformToApplicationSummaryDTO,
  checkStudyStartDateWithinProgramYear,
  checkNotValidStudyPeriod,
  PIR_OR_DATE_OVERLAP_ERROR,
  PIR_OR_DATE_OVERLAP_ERROR_MESSAGE,
} from "../../utilities";
import {
  INVALID_STUDY_DATES,
  OFFERING_START_DATE_ERROR,
} from "../../constants";
import { ApiTags } from "@nestjs/swagger";

@Controller("application")
@ApiTags("application")
export class ApplicationController extends BaseController {
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
    private readonly assessmentService: StudentAssessmentService,
  ) {
    super();
    this.config = this.configService.getConfig();
  }

  @AllowAuthorizedParty(AuthorizedParties.student)
  @Get(":id")
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
    const firstCOE =
      await this.disbursementScheduleService.getFirstCOEOfApplication(
        applicationId,
      );
    return transformToApplicationDetailDto(application, firstCOE);
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
  @AllowAuthorizedParty(AuthorizedParties.student)
  @Patch(":applicationId/submit")
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
  @AllowAuthorizedParty(AuthorizedParties.student)
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
  @AllowAuthorizedParty(AuthorizedParties.student)
  @Patch(":applicationId/draft")
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
  @AllowAuthorizedParty(AuthorizedParties.student)
  @Get(":applicationId/assessment")
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
  @AllowAuthorizedParty(AuthorizedParties.student)
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
  @AllowAuthorizedParty(AuthorizedParties.student)
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
      throw new UnprocessableEntityException(
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
  @AllowAuthorizedParty(AuthorizedParties.student)
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
      throw new UnprocessableEntityException(
        "The user is not associated with a student.",
      );
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
   * API to fetch application details by applicationId and studentId.
   * This API will be used by ministry users.
   * @param applicationId
   * @param userId
   * @returns Application details
   */
  @Groups(UserGroups.AESTUser)
  @AllowAuthorizedParty(AuthorizedParties.aest)
  @Get(":applicationId/student/:studentId/aest")
  async getByStudentAndApplicationId(
    @Param("applicationId") applicationId: number,
    @Param("studentId") studentId: number,
  ): Promise<GetApplicationBaseDTO> {
    const application = await this.applicationService.getApplicationByIdAndUser(
      applicationId,
      undefined,
      studentId,
    );
    if (!application) {
      throw new NotFoundException(
        `Application id ${applicationId} was not found.`,
      );
    }
    return transformToApplicationDto(application);
  }

  /**
   * API to fetch all the applications that belong to student.
   * This API will be used by ministry users.
   * @param studentId student id
   * @queryParm page, page number if nothing is passed then
   * DEFAULT_PAGE_NUMBER is taken
   * @queryParm pageLimit, page size or records per page, if nothing is
   * passed then DEFAULT_PAGE_LIMIT is taken
   * @queryParm sortField, field to be sorted
   * @queryParm sortOrder, order to be sorted
   * @returns Student Application list with total count
   */
  @Groups(UserGroups.AESTUser)
  @AllowAuthorizedParty(AuthorizedParties.aest)
  @Get("student/:studentId/aest")
  async getSummaryByStudentId(
    @Query("sortField") sortField: string,
    @Query("sortOrder") sortOrder: FieldSortOrder,
    @Param("studentId") studentId: number,
    @Query("page") page = DEFAULT_PAGE_NUMBER,
    @Query("pageLimit") pageLimit = DEFAULT_PAGE_LIMIT,
  ): Promise<StudentApplicationAndCount> {
    const applicationsAndCount =
      await this.applicationService.getAllStudentApplications(
        sortField,
        studentId,
        page,
        pageLimit,
        sortOrder,
      );

    return {
      applications: applicationsAndCount[0].map((application: Application) => {
        return transformToApplicationSummaryDTO(application);
      }),
      totalApplications: applicationsAndCount[1],
    };
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
