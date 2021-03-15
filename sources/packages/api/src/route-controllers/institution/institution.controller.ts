import { Body, Controller, Post } from "@nestjs/common";
import { InstitutionService, UserService } from "../../services";
import { CreateInstitutionDto } from "./models/institution.dto";
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
  ) {
    // Check user exists or not
    const existingUser = await this.userService.getUser(userToken.userName);
    if (existingUser) {
      throw new UnprocessableEntityException("User already exists");
    }

    // Save student
    return this.institutionService.createInstitution(userToken, payload);
  } //create method ends
} //Class ends
