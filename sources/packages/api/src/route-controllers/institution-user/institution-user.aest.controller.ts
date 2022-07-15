import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, Groups, UserToken } from "../../auth/decorators";
import { UserGroups } from "../../auth/user-groups.enum";
import BaseController from "../BaseController";
import { InstitutionUserControllerService } from "./institution-user.controller.service";
import {
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { PaginatedResults } from "../../utilities";
import {
  CreateInstitutionUserAPIInDTO,
  InstitutionUserAPIOutDTO,
  UpdateInstitutionUserAPIInDTO,
  UserActiveStatusAPIInDTO,
} from "./models/institution-user.dto";
import { ClientTypeBaseRoute } from "../../types";
import { IUserToken } from "../../auth/userToken.interface";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";
import { InstitutionUserPaginationOptionsAPIInDTO } from "../models/pagination.dto";

/**
 * Institution user controller for AEST client.
 * Methods related to user management of the users that are associated with an
 * institution and have more permissions/authorization needed.
 */
@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("institution-user")
@ApiTags(`${ClientTypeBaseRoute.AEST}-institution-user`)
export class InstitutionUserAESTController extends BaseController {
  constructor(
    private readonly institutionUserControllerService: InstitutionUserControllerService,
  ) {
    super();
  }

  /**
   * Get institution user summary.
   * @param paginationOptions pagination options.
   * @param institutionId institution to be searched. If not
   * provided the institution id will be retrieved from the token,
   * when available.
   * @returns all filtered institution users.
   */
  @Get()
  async searchUsers(
    @Query("institutionId", ParseIntPipe) institutionId: number,
    @Query() paginationOptions: InstitutionUserPaginationOptionsAPIInDTO,
  ): Promise<PaginatedResults<InstitutionUserAPIOutDTO>> {
    return this.institutionUserControllerService.getInstitutionUsers(
      institutionId,
      paginationOptions,
    );
  }

  /**
   * Create a user, associate with the institution, and assign the authorizations.
   * @param institutionId institution to have the user created.
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
  @Post(":institutionId")
  async createInstitutionUserWithAuth(
    @UserToken() token: IUserToken,
    @Param("institutionId", ParseIntPipe) institutionId: number,
    @Body() payload: CreateInstitutionUserAPIInDTO,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    return this.institutionUserControllerService.createInstitutionUserWithAuth(
      institutionId,
      payload,
      token.userId,
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
  @ApiUnprocessableEntityResponse({
    description:
      "The user is not active" +
      " or the user permission is being updated in a way that no admin will be present" +
      " or a second legal signing authority is trying to be set and only one is allowed.",
  })
  @Patch(":institutionUserId")
  async updateInstitutionUserWithAuth(
    @UserToken() token: IUserToken,
    @Param("institutionUserId", ParseIntPipe) institutionUserId: number,
    @Body() payload: UpdateInstitutionUserAPIInDTO,
  ): Promise<void> {
    await this.institutionUserControllerService.updateInstitutionUserWithAuth(
      institutionUserId,
      payload,
      false,
      token.userId,
    );
  }

  /**
   * Get institution user by user name(guid).
   * @param institutionUserId institution user id to have the permissions updated.
   * @returns institution user details.
   */
  @ApiNotFoundResponse({
    description: "User not found.",
  })
  @Get(":institutionUserId")
  async getInstitutionUserByUserName(
    @Param("institutionUserId", ParseIntPipe) institutionUserId: number,
  ): Promise<InstitutionUserAPIOutDTO> {
    return this.institutionUserControllerService.getInstitutionUserById(
      institutionUserId,
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
  @Patch(":institutionUserId/status")
  async updateUserStatus(
    @UserToken() userToken: IUserToken,
    @Param("institutionUserId", ParseIntPipe) institutionUserId: number,
    @Body() payload: UserActiveStatusAPIInDTO,
  ): Promise<void> {
    await this.institutionUserControllerService.updateUserStatus(
      institutionUserId,
      payload,
      false,
      userToken.userId,
    );
  }
}
