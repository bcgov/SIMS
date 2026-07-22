import {
  Body,
  Controller,
  Patch,
  Get,
  Post,
  Query,
  Param,
  ParseIntPipe,
} from "@nestjs/common";
import { IInstitutionUserToken } from "../../auth/userToken.interface";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  AllowInactiveUser,
  IsInstitutionAdmin,
  RequiresUserAccount,
  UserToken,
} from "../../auth/decorators";
import { InstitutionService, UserService, BCeIDService } from "../../services";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";
import {
  InstitutionUserAPIOutDTO,
  CreateInstitutionUserAPIInDTO,
  UpdateInstitutionUserAPIInDTO,
  UserActiveStatusAPIInDTO,
  InstitutionUserStatusAPIOutDTO,
  InstitutionUserDetailAPIOutDTO,
} from "./models/institution-user.dto";
import {
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import BaseController from "../BaseController";
import { InstitutionUserControllerService } from "./institution-user.controller.service";
import { ClientTypeBaseRoute } from "../../types";
import { PaginatedResults, getUserFullName } from "../../utilities";
import { BCeIDAccountTypeCodes } from "../../services/bceid/bceid.models";
import { InstitutionUserPaginationOptionsAPIInDTO } from "../models/pagination.dto";

/**
 * Institution user controller for institutions client.
 * Methods related to user management of the users that are associated with an
 * institution and have more permissions/authorization needed.
 */
@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("institution-user")
@ApiTags(`${ClientTypeBaseRoute.Institution}-institution-user`)
export class InstitutionUserInstitutionsController extends BaseController {
  constructor(
    private readonly institutionService: InstitutionService,
    private readonly institutionUserControllerService: InstitutionUserControllerService,
    private readonly userService: UserService,
    private readonly bceidAccountService: BCeIDService,
  ) {
    super();
  }

  /**
   * Get details of an institution user who is logged in.
   * @returns user details.
   */
  @Get("my-details")
  async getMyInstitutionDetails(
    @UserToken() token: IInstitutionUserToken,
  ): Promise<InstitutionUserDetailAPIOutDTO> {
    const userDetails = await this.userService.getUser(token.userName);
    const user = {
      userName: userDetails.userName,
      firstName: userDetails?.firstName,
      lastName: userDetails.lastName,
      isActive: userDetails.isActive,
      userFullName: getUserFullName(userDetails),
      isAdmin: token.authorizations.isAdmin(),
      email: userDetails.email,
    };
    const authorizations = {
      institutionId: token.authorizations.institutionId,
      authorizations: token.authorizations.authorizations.map(
        (authorization) => {
          return {
            locationId: authorization.locationId,
            userType: authorization.userType,
            userRole: authorization.userRole,
          };
        },
      ),
    };
    return {
      user: user,
      authorizations: authorizations,
    };
  }

  /**
   * Get institution user summary.
   * @param paginationOptions pagination options.
   * provided the institution id will be retrieved from the token,
   * when available.
   * @returns all filtered institution users.
   */
  @Get()
  async getInstitutionUserSummary(
    @Query() paginationOptions: InstitutionUserPaginationOptionsAPIInDTO,
    @UserToken() token: IInstitutionUserToken,
  ): Promise<PaginatedResults<InstitutionUserAPIOutDTO>> {
    return this.institutionUserControllerService.getInstitutionUsers(
      token.authorizations.institutionId,
      paginationOptions,
    );
  }

  /**
   * Create a user, associate with the institution, and assign the authorizations.
   * @param payload authorizations to be associated with the user.
   * @returns Primary identifier of the created resource.
   */
  @ApiNotFoundResponse({ description: "Institution not found." })
  @ApiUnprocessableEntityResponse({
    description:
      "User to be added was not found on BCeID Account Service " +
      "or the user does not belong to the same institution " +
      "or the user already exists " +
      "or a second legal signing authority is trying to be set when one is already in place.",
  })
  @ApiForbiddenResponse({
    description:
      "The user is not allowed to create the requested BCeID account type.",
  })
  @IsInstitutionAdmin()
  @Post()
  async createInstitutionUserWithAuth(
    @UserToken() userToken: IInstitutionUserToken,
    @Body() payload: CreateInstitutionUserAPIInDTO,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    return this.institutionUserControllerService.createInstitutionUserWithAuth(
      userToken.authorizations.institutionId,
      payload,
      userToken.userId,
      BCeIDAccountTypeCodes.Business,
    );
  }

  /**
   * Synchronize the user/institution information from BCeID.
   * Every time that a user login to the system check is some of the readonly
   * information (that must be changed on BCeID) changed.
   */
  @Patch("sync-bceid-info")
  async syncBCeIDInformation(
    @UserToken() token: IInstitutionUserToken,
  ): Promise<void> {
    await this.institutionService.syncBCeIDInformation(
      token.userId,
      token.idp_user_name,
    );
  }

  /**
   * Update the user authorizations for the institution user.
   * @param institutionUserId institution user id to have the permissions updated.
   * @param payload permissions to be updated.
   */
  @ApiNotFoundResponse({
    description: "User to be updated not found.",
  })
  @ApiForbiddenResponse({
    description:
      "User to be updated does not belong to the institution of logged in user.",
  })
  @ApiUnprocessableEntityResponse({
    description:
      "The user is not active" +
      " or the user permission is being updated in a way that no admin will be present" +
      " or a second legal signing authority is trying to be set and only one is allowed.",
  })
  @IsInstitutionAdmin()
  @Patch(":institutionUserId")
  async updateInstitutionUserWithAuth(
    @UserToken() token: IInstitutionUserToken,
    @Param("institutionUserId", ParseIntPipe) institutionUserId: number,
    @Body() payload: UpdateInstitutionUserAPIInDTO,
  ): Promise<void> {
    await this.institutionUserControllerService.updateInstitutionUserWithAuth(
      institutionUserId,
      payload,
      true,
      token.userId,
      token.authorizations.institutionId,
    );
  }

  /**
   * Get the user status from institution perspective returning the
   * possible user and institution association.
   * @returns information to support the institution login process and
   * the decisions that need happen to complete the process.
   */
  @RequiresUserAccount(false)
  @AllowInactiveUser()
  @Get("status")
  async getInstitutionUserStatus(
    @UserToken() token: IInstitutionUserToken,
  ): Promise<InstitutionUserStatusAPIOutDTO> {
    const status = {} as InstitutionUserStatusAPIOutDTO;
    status.isExistingUser = !!token.userId;
    status.isActiveUser = token.isActive;
    if (status.isExistingUser) {
      // If the user exists there is no need to return any additional data.
      return status;
    }
    // Try to find the business BCeID user on BCeID Web Service.
    // For basic BCeID user the information isExistingUser and isActiveUser
    // are enough to define if the user can complete the login or not.
    const businessBCeIDUserAccount =
      await this.bceidAccountService.getAccountDetails(
        token.idp_user_name,
        BCeIDAccountTypeCodes.Business,
      );
    if (businessBCeIDUserAccount) {
      status.hasBusinessBCeIDAccount = true;
      // Check if the institution associated with the BCeID business guid is already present.
      status.associatedInstitutionExists =
        await this.institutionService.doesExist(
          businessBCeIDUserAccount.institution.guid,
        );
    }
    return status;
  }

  /**
   * Get institution user by institution user id.
   * @param institutionUserId institution user id to have the permissions updated.
   * @returns institution user details.
   */
  @ApiNotFoundResponse({
    description: "User not found.",
  })
  @ApiForbiddenResponse({
    description:
      "Details requested for user who does not belong to the institution.",
  })
  @IsInstitutionAdmin()
  @Get(":institutionUserId")
  async getInstitutionUserById(
    @Param("institutionUserId", ParseIntPipe) institutionUserId: number,
    @UserToken() token: IInstitutionUserToken,
  ): Promise<InstitutionUserAPIOutDTO> {
    return this.institutionUserControllerService.getInstitutionUserById(
      institutionUserId,
      token.authorizations.institutionId,
    );
  }

  /**
   * Update the active status of the user.
   * @param institutionUserId institution user id to have the permissions updated.
   * @param payload information to enable or disable the user.
   */
  @ApiNotFoundResponse({
    description: "User to be updated not found.",
  })
  @ApiForbiddenResponse({
    description:
      "User to be updated doesn't belong to institution of logged in user.",
  })
  @IsInstitutionAdmin()
  @Patch(":institutionUserId/status")
  async updateUserStatus(
    @UserToken() token: IInstitutionUserToken,
    @Param("institutionUserId", ParseIntPipe) institutionUserId: number,
    @Body() payload: UserActiveStatusAPIInDTO,
  ): Promise<void> {
    await this.institutionUserControllerService.updateUserStatus(
      institutionUserId,
      payload,
      true,
      token.userId,
      token.authorizations.institutionId,
    );
  }
}
