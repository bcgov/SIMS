import { Controller, Get } from "@nestjs/common";
import { BCeIDService, UserService } from "../../services";
import BaseController from "../BaseController";
import { UserToken } from "../../auth/decorators/userToken.decorator";
import { IUserToken } from "../../auth/userToken.interface";
import { extractRawUserName } from "../../utilities/auth-utils";
import { BCeIDDetails } from "./models/bceid-account.model";

@Controller("users")
export class UserController extends BaseController {
  constructor(
    private readonly service: UserService,
    private readonly bceidService: BCeIDService,
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
  async getBCeID(@UserToken() userToken: IUserToken): Promise<BCeIDDetails> {
    const userName = extractRawUserName(userToken.userName);
    const account = await this.bceidService.getAccountDetails(userName);
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
