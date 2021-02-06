import { Controller, Get, Patch, Req } from "@nestjs/common";
import { Request } from "express";
import { AuthService, UserService } from "../../services";
import BaseController from "../BaseController";

@Controller("users")
export class UserController extends BaseController {
  constructor(
    private readonly service: UserService,
    private readonly authService: AuthService,
  ) {
    super();
  }

  @Get("/check-user")
  async checkUser(@Req() request: Request) {
    try {
      const userInfo = this.authService.parseAuthorizationHeader(
        request.headers.authorization,
      );
      const userInSABC = await this.service.getUser(userInfo.userName);
      if (!userInSABC) {
        //TODO: Set a 404 in response when no user is found.
        //response.status(404);
      } else {
        return userInSABC;
      }
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  @Patch("/sync-user")
  async synchronizeUserInfo(@Req() request: Request) {
    try {
      const userInfoBCServiceCard = this.authService.parseAuthorizationHeader(
        request.headers.authorization,
      );
      const syncedUser = await this.service.synchronizeUserInfo(
        userInfoBCServiceCard,
      );
      return syncedUser;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }
}
