import { Controller, Get, UnprocessableEntityException } from "@nestjs/common";
import {
  BCeIDService,
  UserService,
  InstitutionLocationService,
} from "../../services";
import BaseController from "../BaseController";
import { UserToken } from "../../auth/decorators/userToken.decorator";
import { IUserToken } from "../../auth/userToken.interface";
import { BCeIDDetailsDto } from "./models/bceid-account.dto";
import { SearchAccountOptions } from "../../services/bceid/search-bceid.model";
import { BCeIDAccountsDto } from "./models/bceid-accounts.dto";
import { UserLocationDto } from "../institution-locations/models/institution-location.dto";

@Controller("users")
export class UserController extends BaseController {
  constructor(
    private readonly service: UserService,
    private readonly bceidService: BCeIDService,
    private readonly institutionLocationService: InstitutionLocationService,
  ) {
    super();
  }

  @Get("/check-user")
  async checkUser(@UserToken() userToken: IUserToken): Promise<boolean> {
    try {
      const userInSABC = await this.service.getUser(userToken.userName);
      if (!userInSABC) {
        return false;
      } else {
        return true;
      }
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  @Get("bceid-account")
  async getBCeID(
    @UserToken() userToken: IUserToken,
  ): Promise<BCeIDDetailsDto | null> {
    const account = await this.bceidService.getAccountDetails(
      userToken.idp_user_name,
    );
    if (account == null) {
      return null;
    } else {
      return {
        user: {
          guid: account.user.guid,
          displayName: account.user.displayName,
          firstname: account.user.firstname,
          surname: account.user.surname,
          email: account.user.email,
        },
        institution: {
          guid: account.institution.guid,
          legalName: account.institution.legalName,
        },
      };
    }
  }

  @Get("bceid-accounts")
  async getAllBCeIDs(
    @UserToken() userToken: IUserToken,
  ): Promise<BCeIDAccountsDto> {
    const account = await this.bceidService.getAccountDetails(
      userToken.idp_user_name,
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

  @Get("locations")
  async getAllUserLocations(
    @UserToken() userToken: IUserToken,
  ): Promise<UserLocationDto[]> {
    // get all User locations.
    return this.institutionLocationService.getAllUserLocations(
      userToken.userName,
    );
  }

  @Get("/check-active-user")
  async checkActiveUser(@UserToken() userToken: IUserToken): Promise<boolean> {
    try {
      const isActive = await this.service.getActiveUser(userToken.userName);
      if (!isActive) {
        return false;
      } else {
        return true;
      }
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }
}
