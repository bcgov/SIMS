import { Controller, Get, Patch } from "@nestjs/common";
import { StudentService, UserService } from "../../services";
import BaseController from "../BaseController";
import { UserToken } from "src/auth/decorators/userToken.decorator";
import { IUserToken } from "src/auth/userToken.interface";

@Controller("users")
export class UserController extends BaseController {
  constructor(private readonly service: UserService) {
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
}
