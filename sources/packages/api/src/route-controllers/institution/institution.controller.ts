import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  InstitutionLocationService,
  InstitutionService,
  UserService,
} from "../../services";
import {
  CreateInstitutionDto,
  InstitutionDetailDto,
  InstitutionDto,
} from "./models/institution.dto";
import { UserToken } from "../../auth/decorators/userToken.decorator";
import { IUserToken } from "../../auth/userToken.interface";
import BaseController from "../BaseController";
import { InstitutionUserRespDto } from "./models/institution.user.res.dto";
import { InstitutionUserAuthDto } from "./models/institution-user-auth.dto";
import { InstitutionUserRole, InstitutionUserType } from "src/types";
import { InstitutionUserTypeAndRoleResponseDto } from "./models/institution-user-type-role.res.dto";

@Controller("institution")
export class InstitutionController extends BaseController {
  constructor(
    private readonly userService: UserService,
    private readonly institutionService: InstitutionService,
    private readonly institutionLocationService: InstitutionLocationService,
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
    const allInstitutionUsers = await this.institutionService.allUsers(
      institution.id,
    );
    return allInstitutionUsers.map((institutionUser) => {
      const institutionUserResp: InstitutionUserRespDto = {
        id: institutionUser.id,
        authorizations: institutionUser.authorizations.map((auth) => ({
          id: auth.id,
          authType: {
            role: auth.authType?.role,
            type: auth.authType?.type,
          },
          location: {
            name: auth.location?.name,
          },
        })),
        user: {
          ...institutionUser.user,
        },
      };
      return institutionUserResp;
    });
  }

  @Post("/user")
  async createInstitutionUserWithAuth(
    @UserToken() user: IUserToken,
    @Body() body: InstitutionUserAuthDto,
  ) {
    // Validate data
    // Get institution
    const institution = await this.institutionService.getInstituteByUserName(
      user.userName,
    );
    // Get location
    let location;
    if (body.locationId) {
      location = await this.institutionLocationService.findById(
        body.locationId,
      );
      if (!location) {
        throw new UnprocessableEntityException(
          `Unable to find institution location with id: ${body.locationId}`,
        );
      }
    }

    // Now create association
    await this.institutionService.createAssociation({
      institution,
      type: body.userType as InstitutionUserType,
      role: body.userRole as InstitutionUserRole,
      location,
      guid: body.guid,
    });

    return true;
  }

  @Get("/user-types-roles")
  getUserTypesAndRoles(): Promise<InstitutionUserTypeAndRoleResponseDto> {
    return this.institutionService.getUserTypesAndRoles();
  }
} //Class ends
