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
  StudentFileService,
  StudentService,
  WorkflowActionsService,
} from "../../services";
import { IUserToken } from "../../auth/userToken.interface";
import BaseController from "../BaseController";
import {
  CreateApplicationDto,
  GetApplicationDataDto,
  ApplicationStatusToBeUpdatedDto,
} from "./models/application.model";
import { AllowAuthorizedParty, UserToken } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { StudentFile, ApplicationStatus } from "../../database/entities";

@Controller("application")
export class ApplicationController extends BaseController {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly formService: FormService,
    private readonly workflow: WorkflowActionsService,
    private readonly studentService: StudentService,
    private readonly fileService: StudentFileService,
  ) {
    super();
  }

  @AllowAuthorizedParty(AuthorizedParties.student)
  @Get(":id")
  async getByApplicationId(
    @Param("id") applicationId: number,
    @UserToken() userToken: IUserToken,
  ): Promise<GetApplicationDataDto> {
    const application =
      await this.applicationService.getApplicationByIdAndUserName(
        applicationId,
        userToken.userName,
      );
    if (!application) {
      throw new NotFoundException(
        `Application id ${applicationId} was not found.`,
      );
    }

    return {
      data: application.data,
      id: application.id,
      applicationStatus: application.applicationStatus,
      applicationStatusUpdatedOn: application.applicationStatusUpdatedOn,
    };
  }

  @AllowAuthorizedParty(AuthorizedParties.student)
  @Post()
  async create(
    @Body() payload: CreateApplicationDto,
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

    const student = await this.studentService.getStudentByUserId(
      userToken.userId,
    );

    // Check for the existing student files if
    // some association was provided.
    let studentFiles: StudentFile[] = [];
    if (payload.associatedFiles?.length) {
      studentFiles = await this.fileService.getStudentFiles(
        student.id,
        payload.associatedFiles,
      );
    }

    const createdApplication = await this.applicationService.createApplication(
      student.id,
      submissionResult.data,
      studentFiles,
    );
    const assessmentWorflow = await this.workflow.startApplicationAssessment(
      submissionResult.data.data.workflowName,
      createdApplication.id,
    );

    // TODO: Once we have the application status we should run the create/associate
    // under a DB transation to ensure that, if the workflow fails to start we would
    // be rolling back the transaction and returning an error to the student.
    const workflowAssociationResult =
      await this.applicationService.associateAssessmentWorkflow(
        createdApplication.id,
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

    return createdApplication.id;
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

  /**
   * Update Student Application status.
   * @param applicationId application id to be updated.
   * @body payload contains the status, that need to be updated
   */
  @AllowAuthorizedParty(AuthorizedParties.student)
  @Patch(":applicationId/update-status")
  async updateStudentApplicationStatus(
    @UserToken() userToken: IUserToken,
    @Param("applicationId") applicationId: number,
    @Body() payload: ApplicationStatusToBeUpdatedDto,
  ): Promise<void> {
    const student = await this.studentService.getStudentByUserId(
      userToken.userId,
    );
    if (!student) {
      throw new UnprocessableEntityException(
        "The user is not associated with a student.",
      );
    }
    const studentApplication =
      await this.applicationService.getStudentApplicationStatus(
        applicationId,
        student,
      );

    if (!studentApplication) {
      throw new UnprocessableEntityException(
        `Application ${applicationId} associated with student ${student.id} does not exist.`,
      );
    }
    // workflow doest not exists for draft application
    if (studentApplication.applicationStatus !== ApplicationStatus.draft && studentApplication.assessmentWorkflowId) {
      // Calling the API to stop assessment process
      await this.workflow.deleteApplicationAssessment(
        studentApplication.assessmentWorkflowId,
      );
    }
    // updating the application status
    const updateResult =
      await this.applicationService.updateStudentApplicationStatus(
        studentApplication.id,
        payload.applicationStatus,
      );

    if (updateResult.affected === 0) {
      throw new UnprocessableEntityException(
        `Application Status update for Application ${applicationId} failed.`,
      );
    }
  }
}
