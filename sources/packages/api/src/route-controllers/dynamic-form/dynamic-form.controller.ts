import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
} from "@nestjs/common";
import BaseController from "../BaseController";
import axios from "axios";
import { FormService, UsersDraftService } from "../../services";
import { UserToken } from "src/auth/decorators/userToken.decorator";
import { IUserToken } from "src/auth/userToken.interface";
import { LoggerService } from "src/logger/logger.service";
import { InjectLogger } from "src/common";

@Controller("dynamic-form")
export class DynamicFormController extends BaseController {
  @InjectLogger()
  logger: LoggerService;

  constructor(
    private readonly formService: FormService,
    private readonly usersDraftService: UsersDraftService,
  ) {
    super();
  }

  @Get()
  async list(): Promise<any> {
    return this.formService.list();
  }
  @Get(":formName")
  async getForm(@Param("formName") formName: string): Promise<any> {
    return this.formService.fetch(formName);
  }

  @Get(":formName/draft")
  async getDraft(
    @UserToken() userToken: IUserToken,
    @Param("formName") formName: string,
  ) {
    const draft = await this.usersDraftService.getDraft(
      formName,
      userToken.userName,
    );
    if (draft) {
      return draft.data;
    } else {
      throw new NotFoundException(
        `No draft data is saved for form: ${formName}`,
      );
    }
  }

  @Post(":formName/draft")
  async saveDraft(
    @UserToken() userToken: IUserToken,
    @Param("formName") formName: string,
    @Body() payload: any,
  ) {
    this.logger.log(`save: ${formName}`);
    await this.usersDraftService.saveDraft(
      formName,
      userToken.userName,
      payload,
    );
    return;
  }

  @Delete(":formName/draft")
  async deleteDraft(
    @UserToken() userToken: IUserToken,
    @Param("formName") formName: string,
  ) {
    await this.usersDraftService.deleteDraft(formName, userToken.userName);
  }
}
