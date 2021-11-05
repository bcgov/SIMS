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
} from "../../services";
import { IUserToken } from "../../auth/userToken.interface";
import BaseController from "../BaseController";
import {
  SaveApplicationDto,
  GetApplicationDataDto,
  ApplicationStatusToBeUpdatedDto,
  ProgramYearOfApplicationDto,
  NOAApplicationDto,
} from "./models/application.model";
import {
  AllowAuthorizedParty,
  UserToken,
  CheckRestrictions,
} from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { ApplicationStatus } from "../../database/entities";
import { ApiProcessError } from "../../types";
import {
  dateString,
  getPIRDeniedReason,
  getCOEDeniedReason,
  getUserFullName,
  transformToApplicationDto,
} from "../../utilities";

@Controller("application")
export class ApplicationController extends BaseController {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly formService: FormService,
    private readonly workflow: WorkflowActionsService,
    private readonly studentService: StudentService,
    private readonly programYearService: ProgramYearService,
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
    return transformToApplicationDto(application);
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

    return {
      assessment: application.assessment,
      applicationNumber: application.applicationNumber,
      fullName: getUserFullName(application.student.user),
      programName: application.offering.educationProgram.name,
      locationName: application.location.name,
      offeringStudyStartDate: dateString(application.offering.studyStartDate),
      offeringStudyEndDate: dateString(application.offering.studyEndDate),
      msfaaNumber: application.msfaaNumber.msfaaNumber,
    };
  }

  /**
   * Confirm Assessment of a Student.
   * @param applicationId application id to be updated.
   */
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
   * @returns program year details of the application
   */
  @AllowAuthorizedParty(AuthorizedParties.student)
  @Get(":applicationId/program-year")
  async programYearOfApplication(
    @UserToken() userToken: IUserToken,
    @Param("applicationId") applicationId: number,
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
      );

    return {
      applicationId: applicationId,
      programYearId: applicationProgramYear.programYear.id,
      formName: applicationProgramYear.programYear.formName,
    } as ProgramYearOfApplicationDto;
  }

  /**
   *
   * @param applicationId
   * @param userId
   * @returns
   */
  @AllowAuthorizedParty(AuthorizedParties.aest)
  @Get("aest/:applicationId/:studentId")
  async getByStudentAndApplicationId(
    @Param("applicationId") applicationId: number,
    @Param("studentId") studentId: number,
  ): Promise<GetApplicationDataDto> {
    const application = await this.applicationService.getApplicationByIdAndUser(
      applicationId,
      0,
      studentId,
    );
    if (!application) {
      throw new NotFoundException(
        `Application id ${applicationId} was not found.`,
      );
    }
    return transformToApplicationDto(application);
  }
}
