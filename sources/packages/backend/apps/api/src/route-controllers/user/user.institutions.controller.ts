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
import { InstitutionUserAPIOutDTO } from "./models/institution-user.dto";
import { InstitutionUserPersistAPIInDTO } from "./models/institution-user-persist.dto";
import { BCeIDAccountsAPIOutDTO } from "./models/bceid-accounts.dto";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, AllowInactiveUser } from "../../auth/decorators";
import { ApiTags, ApiUnprocessableEntityResponse } from "@nestjs/swagger";
import { BCeIDAccountTypeCodes } from "../../services/bceid/bceid.models";
import { UserControllerService } from "..";

@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("users")
@ApiTags("users")
export class UserInstitutionsController extends BaseController {
  constructor(
    private readonly service: UserService,
    private readonly bceidService: BCeIDService,
    private readonly userControllerService: UserControllerService,
  ) {
    super();
  }

  @AllowInactiveUser()
  @Get("bceid-account")
  async getBCeID(
    @UserToken() userToken: IUserToken,
  ): Promise<BCeIDDetailsAPIOutDTO | null> {
    const account = await this.bceidService.getAccountDetails(
      userToken.idp_user_name,
      // TODO: To be changed to allow basic BCeID sign in.
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

  @ApiUnprocessableEntityResponse({
    description:
      "Not able to retrieve BCeID business account details for the current authenticated user.",
  })
  @Get("bceid-accounts")
  async getAllBCeIDs(
    @UserToken() userToken: IUserToken,
  ): Promise<BCeIDAccountsAPIOutDTO> {
    return await this.userControllerService.getAllBCeIDs(userToken);
  }

  @ApiUnprocessableEntityResponse({
    description: "No user record found for user.",
  })
  @Get("institution")
  async institutionDetail(
    @UserToken() userToken: IUserToken,
  ): Promise<InstitutionUserAPIOutDTO> {
    const user = await this.service.getActiveUser(userToken.userName);
    if (!user) {
      throw new UnprocessableEntityException("No user record found for user.");
    }
    const institutionUser = new InstitutionUserAPIOutDTO();
    institutionUser.userEmail = user.email;
    institutionUser.userFirstName = user.firstName;
    institutionUser.userLastName = user.lastName;
    return institutionUser;
  }

  @ApiUnprocessableEntityResponse({
    description: "No user record found for user.",
  })
  @Patch("institution")
  async updateInstitutionUser(
    @UserToken() userToken: IUserToken,
    @Body() body: InstitutionUserPersistAPIInDTO,
  ): Promise<void> {
    const user = await this.service.getActiveUser(userToken.userName);
    if (!user) {
      throw new UnprocessableEntityException("No user record found for user.");
    }
    this.service.updateUserEmail(user.id, body.userEmail);
  }
}
