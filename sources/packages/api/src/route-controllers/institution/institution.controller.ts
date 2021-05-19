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
import {
  CreateInstitutionDto,
  InstitutionDetailDto,
  InstitutionDto,
} from "./models/institution.dto";
import { UserToken } from "../../auth/decorators/userToken.decorator";
import { IUserToken } from "../../auth/userToken.interface";
import BaseController from "../BaseController";
import { InstitutionUserRespDto } from "./models/institution.user.res.dto";

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
    @Body() payload: InstitutionDto,
    @UserToken() userToken: IUserToken,
  ) {
    await this.institutionService.updateInstitution(userToken, payload);
  }

  @Get()
  async institutionDetail(
    @UserToken() token: IUserToken,
  ): Promise<InstitutionDetailDto> {
    return this.institutionService.institutionDetail(token);
  }

  @Patch("/sync")
  async sync(@UserToken() token: IUserToken) {
    await this.institutionService.syncInstitution(token);
  }

  @Get("/users")
  async allUsers(
    @UserToken() user: IUserToken,
  ): Promise<InstitutionUserRespDto[]> {
    const institution = await this.institutionService.getInstituteByUserName(
      user.userName,
    );
    return (await this.institutionService.allUsers(institution.id)).map(
      (item) => {
        const r: InstitutionUserRespDto = {
          id: item.id,
          authorizations: item.authorizations.map((auth) => ({
            authType: {
              role: auth.authType?.role,
              type: auth.authType?.type,
            },
            location: auth?.location?.name,
          })),
          user: {
            ...item.user,
          },
        };
        return r;
      },
    );
  }
} //Class ends
