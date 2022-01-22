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
} from "../../services";
import { IUserToken } from "../../auth/userToken.interface";
import BaseController from "../BaseController";
import {
  SaveApplicationDto,
  GetApplicationDataDto,
  GetApplicationBaseDTO,
  ApplicationStatusToBeUpdatedDto,
  ProgramYearOfApplicationDto,
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
import { ApplicationStatus, Application } from "../../database/entities";
import { ApiProcessError } from "../../types";
import {
  dateString,
  getUserFullName,
  FieldSortOrder,
  DEFAULT_PAGE_NUMBER,
  DEFAULT_PAGE_LIMIT,
  transformToApplicationSummaryDTO,
  checkStudyStartDateWithinProgramYear,
  checkNotValidStudyPeriod,
  addDays,
  subtractDays,
} from "../../utilities";
import {
  INVALID_STUDY_DATES,
  OFFERING_START_DATE_ERROR,
} from "../../constants";
export const PIR_OR_DATE_OVERLAP_ERROR = "PIR_OR_DATE_OVERLAP_ERROR";
export const PIR_OR_DATE_OVERLAP_ERROR_MESSAGE =
  "There is an existing application already with overlapping study period or a pending PIR.";

@Controller("application")
export class ApplicationController extends BaseController {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly formService: FormService,
    private readonly workflow: WorkflowActionsService,
    private readonly studentService: StudentService,
    private readonly programYearService: ProgramYearService,
    private readonly offeringService: EducationProgramOfferingService,
  ) {
    super();
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
    return transformToApplicationDetailDto(application);
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

    const existingOverlapApplication =
      await this.applicationService.validatePIRAndDateOverlap(
        userToken.userId,
        subtractDays(studyStartDate, 1),
        addDays(studyEndDate, 1),
      );
    if (existingOverlapApplication) {
      throw new UnprocessableEntityException(
        PIR_OR_DATE_OVERLAP_ERROR,
        PIR_OR_DATE_OVERLAP_ERROR_MESSAGE,
      );
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
      const submittedApplication =
        await this.applicationService.submitApplication(
          applicationId,
          student.id,
          programYear.id,
          submissionResult.data.data,
          payload.associatedFiles,
        );
      this.applicationService.startApplicationAssessment(
        submittedApplication.id,
      );
    } catch (error) {
      if (error.name === APPLICATION_NOT_FOUND) {
        throw new NotFoundException(error.message);
      }
      if (error.name === APPLICATION_NOT_VALID) {
        throw new UnprocessableEntityException(error.message);
      }
      throw new InternalServerErrorException(
        "Unexpected error while submitting the application.",
      );
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
      await this.workflow.deleteApplicationAssessment(
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
  ): Promise<ProgramYearOfApplicationDto> {
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
    } as ProgramYearOfApplicationDto;
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
}
