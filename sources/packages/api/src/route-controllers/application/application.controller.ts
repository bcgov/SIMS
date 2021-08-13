import {
  BadRequestException,
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Patch,
  Post,
  Patch,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  ApplicationService,
  APPLICATION_DRAFT_NOT_FOUND,
  FormService,
  ONLY_ONE_DRAFT_ERROR,
  StudentService,
  WorkflowActionsService,
} from "../../services";
import { IUserToken } from "../../auth/userToken.interface";
import BaseController from "../BaseController";
import {
  CreateApplicationDto,
  GetApplicationDataDto,
} from "./models/application.model";
import { AllowAuthorizedParty, UserToken } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { ApiProcessError } from "../../types";

@Controller("application")
export class ApplicationController extends BaseController {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly formService: FormService,
    private readonly workflow: WorkflowActionsService,
    private readonly studentService: StudentService,
  ) {
    super();
  }

  @AllowAuthorizedParty(AuthorizedParties.student)
  @Get(":id/data")
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

    return { data: application.data };
  }

  @AllowAuthorizedParty(AuthorizedParties.student)
  @Patch(":applicationId/submit")
  async submitApplication(
    @Body() payload: CreateApplicationDto,
    @Param("applicationId") applicationId: number,
    @UserToken() userToken: IUserToken,
  ): Promise<number> {
    const submissionResult = await this.formService.dryRunSubmission(
      "SFAA2022-23",
      payload.data,
    );

    if (!submissionResult.valid) {
      throw new BadRequestException(
        "Not able to create an applicaion due to an invalid request.",
      );
    }

    const applicationToSubmit =
      await this.applicationService.getApplicationByIdAndUser(
        applicationId,
        userToken.userId,
      );
    if (!applicationToSubmit) {
      throw new NotFoundException("Student Application not found.");
    }

    const student = await this.studentService.getStudentByUserId(
      userToken.userId,
    );

    const submittedApplication =
      await this.applicationService.submitApplication(
        applicationId,
        student.id,
        submissionResult.data,
        payload.associatedFiles,
      );

    const assessmentWorflow = await this.workflow.startApplicationAssessment(
      submissionResult.data.data.workflowName,
      submittedApplication.id,
    );

    // TODO: Once we have the application status we should run the create/associate
    // under a DB transation to ensure that, if the workflow fails to start we would
    // be rolling back the transaction and returning an error to the student.
    const workflowAssociationResult =
      await this.applicationService.associateAssessmentWorkflow(
        submittedApplication.id,
        assessmentWorflow.id,
      );

    // 1 means the number of affected rows expected while
    // associating the workflow id.
    if (workflowAssociationResult.affected !== 1) {
      // TODO: Once we add a transaction, this error should force a rollback
      // and should also cancel the workflow.
      throw new InternalServerErrorException(
        "Error while associating the assessment workflow.",
      );
    }

    return submittedApplication.id;
  }

  @AllowAuthorizedParty(AuthorizedParties.student)
  @Post("draft")
  async createDraft(
    @Body() payload: CreateApplicationDto,
    @UserToken() userToken: IUserToken,
  ): Promise<number> {
    const student = await this.studentService.getStudentByUserId(
      userToken.userId,
    );

    try {
      const draftApplication =
        await this.applicationService.saveDraftApplication(
          student.id,
          payload.data,
          payload.associatedFiles,
        );
      return draftApplication.id;
    } catch (error) {
      if (error.name === ONLY_ONE_DRAFT_ERROR) {
        throw new UnprocessableEntityException(
          new ApiProcessError(error.message, error.name),
        );
      }
      throw new InternalServerErrorException(
        "Unexpected error while creating the application draft.",
      );
    }
  }

  @AllowAuthorizedParty(AuthorizedParties.student)
  @Patch(":applicationId/draft")
  async updateDraft(
    @Body() payload: CreateApplicationDto,
    @Param("applicationId") applicationId: number,
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    const student = await this.studentService.getStudentByUserId(
      userToken.userId,
    );

    try {
      await this.applicationService.saveDraftApplication(
        student.id,
        payload.data,
        payload.associatedFiles,
        applicationId,
      );
    } catch (error) {
      if (error.name === APPLICATION_DRAFT_NOT_FOUND) {
        throw new NotFoundException(error);
      }
      throw new InternalServerErrorException(
        "Unexpected error while updating the application draft.",
      );
    }
  }

  @Get(":applicationId/assessment")
  async getAssessmentInApplication(
    @Param("applicationId") applicationId: number,
  ): Promise<any> {
    const assessment =
      await this.applicationService.getAssessmentByApplicationId(applicationId);
    if (!assessment) {
      throw new NotFoundException(
        `Assessment for the application id ${applicationId} was not calculated.`,
      );
    }

    return assessment;
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
}
