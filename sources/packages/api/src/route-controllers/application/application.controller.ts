import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { Response } from "express";
import {
  ApplicationFileService,
  ApplicationService,
  FormService,
  StudentService,
  WorkflowActionsService,
} from "../../services";
import { IUserToken } from "../../auth/userToken.interface";
import BaseController from "../BaseController";
import {
  ApplicationFileCreateDto,
  CreateApplicationDto,
  GetApplicationDataDto,
} from "./models/application.model";
import { AllowAuthorizedParty, Public, UserToken } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { FileInterceptor } from "@nestjs/platform-express";
import { Readable } from "stream";

@Controller("application")
export class ApplicationController extends BaseController {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly formService: FormService,
    private readonly workflow: WorkflowActionsService,
    private readonly fileService: ApplicationFileService,
    private readonly studentService: StudentService,
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

    const createdApplication = await this.applicationService.createApplication(
      userToken,
      submissionResult.data,
    );

    await this.workflow.startApplicationAssessment(
      submissionResult.data.data.workflowName,
      createdApplication.id,
    );

    return createdApplication.id;
  }

  @Post("files")
  @UseInterceptors(FileInterceptor("file"))
  async uploadFile(
    @UserToken() userToken: IUserToken,
    @UploadedFile() file: Express.Multer.File,
    @Body("uniqueFileName") uniqueFileName: string,
    @Body("group") groupName: string,
  ): Promise<ApplicationFileCreateDto> {
    console.dir(file);
    console.dir(uniqueFileName);

    const student = await this.studentService.getStudentByUserName(
      userToken.userName,
    );

    const createdFile = await this.fileService.createFile(
      {
        fileName: file.originalname,
        uniqueFileName: uniqueFileName,
        groupName: groupName,
        mimeType: file.mimetype,
        fileContent: file.buffer,
      },
      student.id,
    );

    return {
      fileName: createdFile.fileName,
      uniqueFileName: createdFile.uniqueFileName,
      url: `application/files/${createdFile.uniqueFileName}`,
      size: createdFile.fileContent.length,
      mimetype: createdFile.mimeType,
    };
  }

  @Get("files/:uniqueFileName")
  async getUploadedFile(
    @UserToken() userToken: IUserToken,
    @Param("uniqueFileName") uniqueFileName: string,
    @Res() response: Response,
  ) {
    const student = await this.studentService.getStudentByUserName(
      userToken.userName,
    );

    const studentFile = await this.fileService.getStudentFile(
      student.id,
      uniqueFileName,
    );

    if (!studentFile) {
      throw new NotFoundException(
        "Requested file was not found or you do not have access to it.",
      );
    }

    response.setHeader("Content-Type", studentFile.mimeType);
    response.setHeader(
      "Content-Disposition",
      `attachment; filename=${studentFile.fileName}`,
    );
    response.setHeader(
      "Content-Length",
      studentFile.fileContent.length.toString(),
    );

    const stream = new Readable();
    stream.push(studentFile.fileContent);
    stream.push(null);

    stream.pipe(response);
  }
}
