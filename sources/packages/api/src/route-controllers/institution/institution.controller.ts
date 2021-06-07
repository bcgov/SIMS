import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UnprocessableEntityException,
  Param,
} from "@nestjs/common";
import { BCeIDService, InstitutionService, UserService } from "../../services";
import {
  CreateInstitutionDto,
  InstitutionDetailDto,
  InstitutionDto,
} from "./models/institution.dto";
import { UserToken } from "../../auth/decorators/userToken.decorator";
import { IUserToken } from "../../auth/userToken.interface";
import BaseController from "../BaseController";
import {
  InstitutionUserRespDto,
  InstitutionLocationUserAuthDto,
  InstitutionUserAuthorizations,
} from "./models/institution.user.res.dto";
import { InstitutionUserAuthDto } from "./models/institution-user-auth.dto";
import {
  InstitutionUserTypeAndRoleResponseDto,
  InstitutionUserPermissionDto,
} from "./models/institution-user-type-role.res.dto";
import { UserDto } from "../user/models/user.dto";
@Controller("institution")
export class InstitutionController extends BaseController {
  constructor(
    private readonly userService: UserService,
    private readonly institutionService: InstitutionService,
    private readonly accountService: BCeIDService,
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
          email: institutionUser.user.email,
          firstName: institutionUser.user.firstName,
          lastName: institutionUser.user.lastName,
          userName: institutionUser.user.userName,
          isActive: institutionUser.user.isActive,
        },
      };
      return institutionUserResp;
    });
  }

  /**
   * Creates all necessary records to have a new user added to the
   * institution, with the right permissions and ready to login.
   */
  @Post("/user")
  async createInstitutionUserWithAuth(
    @Body() payload: InstitutionUserAuthDto,
    @UserToken() user: IUserToken,
  ): Promise<number> {
    // Get institution
    const institution = await this.institutionService.getInstituteByUserName(
      user.userName,
    );
    if (!institution) {
      throw new UnprocessableEntityException(
        "The user has no institution associated with.",
      );
    }
    // Find user on BCeID Web Service
    const bceidUserAccount = await this.accountService.getAccountDetails(
      payload.userId,
    );
    if (!bceidUserAccount) {
      throw new UnprocessableEntityException(
        "User not found on BCeID Web Service.",
      );
    }
    // Check if the user being added to th institution belongs to the institution.
    if (
      institution.guid.toLowerCase() !==
      bceidUserAccount.institution.guid.toLowerCase()
    ) {
      throw new UnprocessableEntityException(
        "User not found under the institution.",
      );
    }

    // Create the user user and the related records.
    const createdInstitutionUser =
      await this.institutionService.createInstitutionUser(
        institution.id,
        bceidUserAccount,
        payload,
      );

    return createdInstitutionUser.id;
  }

  @Get("/user-types-roles")
  async getUserTypesAndRoles(): Promise<InstitutionUserTypeAndRoleResponseDto> {
    return this.institutionService.getUserTypesAndRoles();
  }

  @Get("/user/:userName")
  async getInstitutionLocationByUserName(
    @Param("userName") userName: string,
  ): Promise<InstitutionLocationUserAuthDto> {
    // Get institutionUser
    const institutionUser =
      await this.institutionService.getInstitutionUserByUserName(userName);
    // disabled users details can't be edited
    if (!institutionUser.user.isActive) {
      throw new UnprocessableEntityException("Not an Active User.");
    }
    return {
      id: institutionUser.id,
      user: {
        firstName: institutionUser.user?.firstName,
        lastName: institutionUser.user?.lastName,
        userName: institutionUser.user?.userName,
        isActive: institutionUser.user?.isActive,
        id: institutionUser.user?.id,
      },
      authorizations: institutionUser.authorizations?.map((el) => {
        return {
          location: {
            name: el.location?.name,
            data: el.location?.data,
            id: el.location?.id,
          },
          authType: { type: el.authType?.type, role: el.authType?.role },
        } as InstitutionUserAuthorizations;
      }),
    } as InstitutionLocationUserAuthDto;
  }

  @Patch("/user/:userName")
  async UpdateInstitutionUserWithAuth(
    @Param("userName") userName: string,
    @Body() payload: InstitutionUserPermissionDto,
    @UserToken() user: IUserToken,
  ): Promise<void> {
    // Check its a active user
    const institutionUser =
      await this.institutionService.getInstitutionUserByUserName(userName);
    if (!institutionUser) {
      throw new UnprocessableEntityException(
        "user does not exist in the system.",
      );
    } else if (!institutionUser.user.isActive) {
      throw new UnprocessableEntityException("Not an Active User.");
    }
    // Get institution
    const institution = await this.institutionService.getInstituteByUserName(
      userName,
    );
    if (!institution) {
      throw new UnprocessableEntityException(
        "The user has no institution associated.",
      );
    }

    // remove existing associations and add new associations
    await this.institutionService.updateInstitutionUser(
      payload,
      institutionUser,
    );
  }

  @Patch("user-status/:userName")
  async updateUserStatus(
    @UserToken() userToken: IUserToken,
    @Param("userName") userName: string,
    @Body() body: UserDto,
  ): Promise<void> {
    // Check  user exists or not
    const institutionUser =
      await this.institutionService.getInstitutionUserByUserName(userName);
    if (!institutionUser) {
      throw new UnprocessableEntityException(
        "user does not exist in the system.",
      );
    }
    await this.userService.updateUserStatus(
      institutionUser.user.id,
      body.isActive,
    );
  }
} //Class ends
