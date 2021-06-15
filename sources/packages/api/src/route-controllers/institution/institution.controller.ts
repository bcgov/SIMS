import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UnprocessableEntityException,
  Param,
} from "@nestjs/common";
import {
  BCeIDService,
  InstitutionService,
  UserService,
  InstitutionLocationService,
} from "../../services";
import {
  CreateInstitutionDto,
  InstitutionDetailDto,
  InstitutionDto,
} from "./models/institution.dto";
import { UserToken } from "../../auth/decorators/userToken.decorator";
import { IInstitutionUserToken } from "../../auth/userToken.interface";
import BaseController from "../BaseController";
import {
  InstitutionUserRespDto,
  InstitutionLocationUserAuthDto,
  InstitutionUserAuthorizations,
  InstitutionUserAndAuthDetailsDto,
  InstitutionUserAuth,
} from "./models/institution.user.res.dto";
import { InstitutionUserAuthDto } from "./models/institution-user-auth.dto";
import {
  InstitutionUserTypeAndRoleResponseDto,
  InstitutionUserPermissionDto,
} from "./models/institution-user-type-role.res.dto";
import { UserDto } from "../user/models/user.dto";
import {
  AllowAuthorizedParty,
  IsInstitutionAdmin,
} from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { InstitutionLocationsDetailsDto } from "../institution-locations/models/institution-location.dto";
import { Authorizations } from "../../services/institution-user-auth/institution-user-auth.models";
import { InstitutionLocation } from "../../database/entities/institution-location.model";

@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("institution")
export class InstitutionController extends BaseController {
  constructor(
    private readonly userService: UserService,
    private readonly institutionService: InstitutionService,
    private readonly accountService: BCeIDService,
    private readonly locationService: InstitutionLocationService,
  ) {
    super();
  }

  @Post()
  async create(
    @Body() payload: CreateInstitutionDto,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<void> {
    // Check user exists or not
    const existingUser = await this.userService.getUser(userToken.userName);
    if (existingUser) {
      throw new UnprocessableEntityException("Institution User already exists");
    }

    // Save institution
    await this.institutionService.createInstitution(userToken, payload);
  } //create method ends

  @IsInstitutionAdmin()
  @Patch()
  async update(
    @Body() payload: InstitutionDto,
    @UserToken() userToken: IInstitutionUserToken,
  ) {
    await this.institutionService.updateInstitution(userToken, payload);
  }

  @IsInstitutionAdmin()
  @Get()
  async institutionDetail(
    @UserToken() token: IInstitutionUserToken,
  ): Promise<InstitutionDetailDto> {
    return this.institutionService.institutionDetail(token);
  }

  @Patch("/sync")
  async sync(@UserToken() token: IInstitutionUserToken) {
    await this.institutionService.syncInstitution(token);
  }

  @IsInstitutionAdmin()
  @Get("/users")
  async allUsers(
    @UserToken() user: IInstitutionUserToken,
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
  @IsInstitutionAdmin()
  @Post("/user")
  async createInstitutionUserWithAuth(
    @Body() payload: InstitutionUserAuthDto,
    @UserToken() user: IInstitutionUserToken,
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
    @Param("userName") userName: string,
    @Body() body: UserDto,
  ): Promise<void> {
    // Check  user exists or not
    // TODO: Check if the user belongs to the institution.
    // We can pass the institution id to getInstitutionUserByUserName to ensure it.
    // The institution id is present on token.
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

  @Get("/my-details")
  async getMyDetails(
    @UserToken() token: IInstitutionUserToken,
  ): Promise<InstitutionUserAndAuthDetailsDto> {
    // Get logged in user and location details with auth
    const institutionUser =
      await this.institutionService.getInstitutionUserByUserName(
        token.userName,
      );
    const user = {
      user: {
        firstName: institutionUser.user?.firstName,
        lastName: institutionUser.user?.lastName,
        isActive: institutionUser.user?.isActive,
        isAdmin: token.authorizations.isAdmin,
        email: institutionUser.user?.email,
      },
    };
    const LocationAuth = {
      authorizations: {
        institutionId: token.authorizations.institutionId,
        authorizations: token.authorizations.authorizations.map(
          (el: Authorizations) => {
            return {
              locationId: el.locationId,
              userType: el.userType,
              userRole: el.userRole,
            };
          },
        ),
      } as InstitutionUserAuth,
    };

    return {
      ...user,
      ...LocationAuth,
    };
  }

  @Get("/my-locations")
  async getMyInstitutionLocations(
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<InstitutionLocationsDetailsDto[]> {
    // get all institution locations that user has access too.
    const InstitutionLocationData: InstitutionLocation[] =
      userToken.authorizations.isAdmin()
        ? await this.locationService.getAllInstitutionlocations(
            userToken?.authorizations?.institutionId,
          )
        : await this.locationService.getMyInstitutionlocations(
            userToken.authorizations.getLocationsIds(),
          );
    return InstitutionLocationData.map((el: InstitutionLocation) => {
      return {
        id: el.id,
        name: el.name,
        address: {
          addressLine1: el.data.address?.addressLine1,
          addressLine2: el.data.address?.addressLine2,
          province: el.data.address?.province,
          country: el.data.address?.country,
          city: el.data.address?.city,
          postalCode: el.data.address?.postalCode,
        },
      } as InstitutionLocationsDetailsDto;
    });
  }
}
