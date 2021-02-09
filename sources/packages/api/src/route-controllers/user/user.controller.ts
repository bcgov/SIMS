import { Controller, Get, Patch, Req} from "@nestjs/common";
import { Request } from "express";
import { AuthService, UserService } from "../../services";
import BaseController from "../BaseController";
import UserSyncInfoDto from "./model/user.dto"

@Controller("users")
export class UserController extends BaseController {
  constructor(
    private readonly service: UserService,
    private readonly authService: AuthService,
  ) {
    super();
  }

  @Get("/check-user")
  async checkUser(@Req() request: Request): Promise<boolean> {
    try {
      const userInfo = this.authService.parseAuthorizationHeader(
        request.headers.authorization,
      );
      const userInSABC = await this.service.getUser(userInfo.userName);                
      if(!userInSABC){
        return false
      }  else {
        return true
      }
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  @Patch("/sync-user")
  async synchronizeUserInfo(@Req() request: Request):Promise<UserSyncInfoDto> {
    try {
      const userInfoBCServiceCard = this.authService.parseAuthorizationHeader(
        request.headers.authorization,
      );
      const syncedUser = await this.service.synchronizeUserInfo(
        userInfoBCServiceCard,
      );
      const userSyncInfo = new UserSyncInfoDto();
      userSyncInfo.firstName = syncedUser.firstName;
      userSyncInfo.lastName = syncedUser.lastName;
      userSyncInfo.email = syncedUser.email;
      return userSyncInfo;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }
}
