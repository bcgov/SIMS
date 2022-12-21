import {
  Controller,
  Get,
  Put,
  UnprocessableEntityException,
} from "@nestjs/common";
import { BCeIDService, UserService } from "../../services";
import BaseController from "../BaseController";
import { UserToken } from "../../auth/decorators/userToken.decorator";
import { IUserToken } from "../../auth/userToken.interface";
import { SearchAccountOptions } from "../../services/bceid/search-bceid.model";
import { BCeIDAccountsAPIOutDTO } from "./models/bceid-accounts.dto";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { UserGroups } from "../../auth/user-groups.enum";
import { AllowAuthorizedParty, Groups } from "../../auth/decorators";
import { ApiTags } from "@nestjs/swagger";
import { BCeIDAccountTypeCodes } from "../../services/bceid/bceid.models";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Controller("users")
@ApiTags("users")
export class UserAESTController extends BaseController {
  constructor(
    private readonly service: UserService,
    private readonly bceidService: BCeIDService,
  ) {
    super();
  }

  @Get("bceid-accounts")
  async getAllBCeIDs(
    @UserToken() userToken: IUserToken,
  ): Promise<BCeIDAccountsAPIOutDTO> {
    // Only business BCeID will execute a search on BCeID Web Services.
    // Basic BCeID need to have the full user name provided to execute the
    // getAccountDetail method on BCeID Web Services.
    const account = await this.bceidService.getAccountDetails(
      userToken.idp_user_name,
      BCeIDAccountTypeCodes.Business,
    );

    if (!account) {
      throw new UnprocessableEntityException(
        "Not able to retrieve BCeID business account details for the current authenticated user.",
      );
    }

    const searchOptions = new SearchAccountOptions();
    searchOptions.requesterUserGuid = account.user.guid;
    searchOptions.businessGuid = account.institution.guid;
    const searchResult = await this.bceidService.searchBCeIDAccounts(
      searchOptions,
    );

    const accounts = searchResult.accounts.map((account) => {
      return {
        guid: account.guid,
        displayName: account.displayName,
        email: account.email,
        firstname: account.firstname,
        surname: account.surname,
        telephone: account.telephone,
        userId: account.userId,
      };
    });

    return {
      accounts,
    };
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
