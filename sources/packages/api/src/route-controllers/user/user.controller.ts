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

  @Roles(Role.Student)
  @Get("/check-user")
  checkUser(@UserToken() user: IUserToken) {
    console.log("check-user");
    console.log(user);
    return this.service.getUser(user.userName);
  }
}
