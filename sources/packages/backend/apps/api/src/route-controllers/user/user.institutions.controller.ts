import {
  Body,
  Controller,
  Get,
  Patch,
  UnprocessableEntityException,
} from "@nestjs/common";
import { BCeIDService, UserService } from "../../services";
import BaseController from "../BaseController";
import { UserToken } from "../../auth/decorators/userToken.decorator";
import { IUserToken } from "../../auth/userToken.interface";
import { BCeIDDetailsAPIOutDTO } from "./models/bceid-account.dto";
import { InstitutionUserDetailsAPIOutDTO } from "./models/institution-user.dto";
import { InstitutionUserPersistAPIInDTO } from "./models/institution-user-persist.dto";
import { BCeIDAccountsAPIOutDTO } from "./models/bceid-accounts.dto";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  AllowInactiveUser,
  RequiresUserAccount,
} from "../../auth/decorators";
import { ApiTags, ApiUnprocessableEntityResponse } from "@nestjs/swagger";
import { BCeIDAccountTypeCodes } from "../../services/bceid/bceid.models";
import { UserControllerService } from "..";
import { ClientTypeBaseRoute } from "../../types";

@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("user")
@ApiTags(`${ClientTypeBaseRoute.Institution}-user`)
export class UserInstitutionsController extends BaseController {
  constructor(
    private readonly userService: UserService,
    private readonly bceidService: BCeIDService,
    private readonly userControllerService: UserControllerService,
  ) {
    super();
  }

  /**
   * Get the BCeID account information from BCeID Web services
   * for the currently authenticated user.
   * @returns BCeID account information from BCeID Web services.
   */
  @RequiresUserAccount(false)
  @AllowInactiveUser()
  @Get("bceid-account")
  async getBCeID(
    @UserToken() userToken: IUserToken,
  ): Promise<BCeIDDetailsAPIOutDTO | null> {
    const account = await this.bceidService.getAccountDetails(
      userToken.idp_user_name,
      BCeIDAccountTypeCodes.Business,
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

  /**
   * Gets all business BCeID accounts information for the
   * for the currently authenticated user.
   * @returns all business BCeID accounts.
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
   * Gets the user details for the authenticated institution user.
   * @param userToken authenticated user token.
   * @returns institution user details.
   */
  @ApiUnprocessableEntityResponse({
    description: "No user record found for user.",
  })
  @Get()
  async institutionDetail(
    @UserToken() userToken: IUserToken,
  ): Promise<InstitutionUserDetailsAPIOutDTO> {
    const user = await this.userService.getActiveUser(userToken.userName);
    if (!user) {
      throw new UnprocessableEntityException("No user record found for user.");
    }
    return {
      userEmail: user.email,
      userFirstName: user.firstName,
      userLastName: user.lastName,
    };
  }

  /**
   * Updates the institution user details.
   * @param body institution user details.
   */
  @ApiUnprocessableEntityResponse({
    description: "No user record found for user.",
  })
  @Patch()
  async updateInstitutionUser(
    @UserToken() userToken: IUserToken,
    @Body() body: InstitutionUserPersistAPIInDTO,
  ): Promise<void> {
    const user = await this.userService.getActiveUser(userToken.userName);
    if (!user) {
      throw new UnprocessableEntityException("No user record found for user.");
    }
    await this.userService.updateUserEmail(user.id, body.userEmail);
  }
}
