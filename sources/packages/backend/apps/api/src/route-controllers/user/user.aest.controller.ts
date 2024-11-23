import { BadRequestException, Controller, Get, Put } from "@nestjs/common";
import { UserService } from "../../services";
import BaseController from "../BaseController";
import { UserToken } from "../../auth/decorators/userToken.decorator";
import { IUserToken } from "../../auth/userToken.interface";
import { BCeIDAccountsAPIOutDTO } from "./models/bceid-accounts.dto";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { UserGroups } from "../../auth/user-groups.enum";
import {
  AllowAuthorizedParty,
  Groups,
  RequiresUserAccount,
} from "../../auth/decorators";
import { ApiTags, ApiUnprocessableEntityResponse } from "@nestjs/swagger";
import { UserControllerService } from "..";
import { ApiProcessError, ClientTypeBaseRoute } from "../../types";
import { MISSING_USER_INFO } from "../../constants";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("user")
@ApiTags(`${ClientTypeBaseRoute.AEST}-user`)
export class UserAESTController extends BaseController {
  constructor(
    private readonly userService: UserService,
    private readonly userControllerService: UserControllerService,
  ) {
    super();
  }

  /**
   * Retrieves business BCeIDs accounts managed by the user.
   * @param userToken authenticated user token.
   * @returns BCeID accounts managed by the user.
   */
  @ApiUnprocessableEntityResponse({
    description:
      "Not able to retrieve BCeID business account details for the current authenticated user.",
  })
  @Get("bceid-accounts")
  getAllBCeIDs(
    @UserToken() userToken: IUserToken,
  ): Promise<BCeIDAccountsAPIOutDTO> {
    return this.userControllerService.getAllBCeIDs(userToken);
  }

  /**
   * Creates or updates Ministry user information.
   * @param userToken user token information to be updated.
   */
  @RequiresUserAccount(false)
  @Put()
  async syncAESTUser(@UserToken() userToken: IUserToken): Promise<void> {
    // If the user token is missing any of the primary user information to create a user
    // then throw an error.
    if (
      !userToken.userName?.trim() ||
      !userToken.email?.trim() ||
      !userToken.lastName?.trim()
    ) {
      throw new BadRequestException(
        new ApiProcessError(
          "User token is missing primary user information.",
          MISSING_USER_INFO,
        ),
      );
    }
    await this.userService.syncUser(
      userToken.userName,
      userToken.email,
      userToken.givenNames,
      userToken.lastName,
    );
  }
}
