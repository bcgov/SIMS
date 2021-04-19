import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  UnprocessableEntityException,
} from "@nestjs/common";
import { InstitutionService, UserService } from "../../services";
import { CreateInstitutionDto, InstituteDto } from "./models/institution.dto";
import { UserToken } from "../../auth/decorators/userToken.decorator";
import { IUserToken } from "../../auth/userToken.interface";
import BaseController from "../BaseController";

@Controller("institution")
export class InstitutionController extends BaseController {
  constructor(
    private readonly userService: UserService,
    private readonly institutionService: InstitutionService,
  ) {
    super();
  }

  @Post()
  async create(
    @Body() payload: CreateInstitutionDto,
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    // Check user exists or not
    const existingUser = await this.userService.getUser(userToken.userName);
    if (existingUser) {
      throw new UnprocessableEntityException("Institution User already exists");
    }

    // Save institution
    await this.institutionService.createInstitution(userToken, payload);
  } //create method ends

  @Patch()
  async update(
    @Body() payload: InstituteDto,
    @UserToken() userToken: IUserToken,
  ) {
    await this.institutionService.updateInstitution(userToken, payload);
  }

  @Get()
  async institutionDetail(@UserToken() token: IUserToken) {
    return this.institutionService.institutionDetail(token);
  }
} //Class ends
