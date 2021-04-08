import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from "@nestjs/common";
import { ApplicationService } from "../../services";
import { UserToken } from "../../auth/decorators/userToken.decorator";
import { IUserToken } from "../../auth/userToken.interface";
import BaseController from "../BaseController";
import { CreateApplicationDto } from "./models/application.model";

@Controller("application")
export class ApplicationController extends BaseController {
  constructor(private readonly applicationService: ApplicationService) {
    super();
  }

  @Get(":id/data")
  async getByApplicationId(
    @Param("id") applicationId: string,
    @UserToken() userToken: IUserToken,
  ): Promise<any> {
    const application = await this.applicationService.getApplicationById(
      applicationId,
      userToken.userName,
    );
    if (!application) {
      throw new NotFoundException(
        `Application id ${applicationId} was not found.`,
      );
    }

    return application.data;
  }

  @Post()
  async create(
    @Body() payload: CreateApplicationDto,
    @UserToken() userToken: IUserToken,
  ): Promise<number> {
    const createdApplication = await this.applicationService.createApplication(
      userToken,
      payload,
    );
    return createdApplication.id;
  }
}
