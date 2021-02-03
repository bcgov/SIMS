import { Controller, Get, Req } from "@nestjs/common";
import { Request } from "express";
import { AuthService, UserService } from "../../services";

@Controller("users")
export class UserController {
  constructor(
    private readonly service: UserService,
    private readonly authService: AuthService,
  ) {}

  @Get("/check-user")
  checkUser(@Req() request: Request) {
    const userInfo = this.authService.parseAuthorizationHeader(
      request.headers.authorization,
    );

    return this.service.getUser(userInfo.userName);
  }
}
