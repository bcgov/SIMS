import { Controller, Get, Req } from "@nestjs/common";
import { Roles } from "src/auth/decorators/roles.decorator";
import { UserToken } from "src/auth/decorators/userToken.decorator";
import { Role } from "src/auth/roles.enum";
import { IUserToken } from "src/auth/userToken.interface";
import { AuthService, UserService } from "../../services";

@Controller("users")
export class UserController {
  constructor(
    private readonly service: UserService,
    private readonly authService: AuthService,
  ) {}

  @Get("/check-user")
  checkUser(@UserToken() user: IUserToken) {
    return this.service.getUser(user.userName);
  }
}
