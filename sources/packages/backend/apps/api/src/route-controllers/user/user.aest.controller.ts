import { Controller, Get, Put } from "@nestjs/common";
import { UserService } from "../../services";
import BaseController from "../BaseController";
import { UserToken } from "../../auth/decorators/userToken.decorator";
import { IUserToken } from "../../auth/userToken.interface";
import { BCeIDAccountsAPIOutDTO } from "./models/bceid-accounts.dto";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { UserGroups } from "../../auth/user-groups.enum";
import { AllowAuthorizedParty, Groups } from "../../auth/decorators";
import { ApiTags } from "@nestjs/swagger";
import { UserControllerService } from "..";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Controller("users")
@ApiTags("users")
export class UserAESTController extends BaseController {
  constructor(
    private readonly service: UserService,
    private readonly userControllerService: UserControllerService,
  ) {
    super();
  }

  @Get("bceid-accounts")
  async getAllBCeIDs(
    @UserToken() userToken: IUserToken,
  ): Promise<BCeIDAccountsAPIOutDTO> {
    return await this.userControllerService.getAllBCeIDs(userToken);
  }

  /**
   * Creates or updates Ministry user information.
   * @param userToken user token information to be updated.
   */
  @Groups(UserGroups.AESTUser)
  @Put("aest")
  async syncAESTUser(@UserToken() userToken: IUserToken): Promise<void> {
    await this.service.syncUser(
      userToken.userName,
      userToken.email,
      userToken.givenNames,
      userToken.lastName,
    );
  }
}
