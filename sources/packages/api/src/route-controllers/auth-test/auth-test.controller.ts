import { Controller, Get } from "@nestjs/common";
import { UserToken } from "../../auth/decorators/userToken.decorator";
import { IUserToken } from "../../auth/userToken.interface";
import { Public } from "../../auth/decorators/public.decorator";

@Controller("auth-test")
export class AuthTestController {
  @Public()
  @Get("/public-route")
  async publicRoute(@UserToken() userToken: IUserToken): Promise<void> {
    console.log("public-route");
  }

  @Get("/authenticated-route")
  async authenticatedRoute(@UserToken() userToken: IUserToken): Promise<void> {
    console.log("authenticated-route");
  }
}
