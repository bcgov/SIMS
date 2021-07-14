import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
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
} from "./models/application.model";
import { AllowAuthorizedParty, UserToken } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";

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
  @Get(":id/data")
  async getByApplicationId(
    @Param("id") applicationId: string,
    @UserToken() userToken: IUserToken,
  ): Promise<GetApplicationDataDto> {
    const application = await this.applicationService.getApplicationById(
      applicationId,
      userToken.userName,
    );

    if (!application) {
      throw new NotFoundException(
        `Application id ${applicationId} was not found.`,
      );
    }

    return { data: application.data };
  }

  @AllowAuthorizedParty(AuthorizedParties.student)
  @Post()
  async create(
    @Body() payload: CreateApplicationDto,
    @UserToken() userToken: IUserToken,
  ): Promise<number> {
    const submissionResult = await this.formService.dryRunSubmission(
      "SFAA2022-23-andrew-2020-07-08",
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

    const studentFiles = await this.fileService.getStudentFiles(
      student.id,
      payload.associatedFiles,
    );

    const createdApplication = await this.applicationService.createApplication(
      student.id,
      submissionResult.data,
      studentFiles,
    );

    // await this.workflow.startApplicationAssessment(
    //   submissionResult.data.data.workflowName,
    //   createdApplication.id,
    // );

    return createdApplication.id;
  }
}
