import { UnprocessableEntityException, Injectable } from "@nestjs/common";
import { IUserToken } from "../../auth/userToken.interface";
import { BCeIDService } from "../../services";
import { BCeIDAccountTypeCodes } from "../../services/bceid/bceid.models";
import { SearchAccountOptions } from "../../services/bceid/search-bceid.model";
import { BCeIDAccountsAPIOutDTO } from "./models/bceid-accounts.dto";

@Injectable()
export class UserControllerService {
  constructor(private readonly bceidService: BCeIDService) {}

  async getAllBCeIDs(userToken: IUserToken): Promise<BCeIDAccountsAPIOutDTO> {
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
}
