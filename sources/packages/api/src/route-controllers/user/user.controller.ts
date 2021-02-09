import { Controller, Get, Req } from "@nestjs/common";
import { UserToken } from "src/auth/decorators/userToken.decorator";
import { IUserToken } from "src/auth/userToken.interface";
import { UserService } from "../../services";

@Controller("users")
export class UserController {
  constructor(private readonly service: UserService) {}

  @Get("/check-user")
  checkUser(@UserToken() user: IUserToken) {
    return this.service.getUser(user.userName);
  }
}
