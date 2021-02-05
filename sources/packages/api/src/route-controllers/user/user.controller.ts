import { Controller, Get, Patch, Req } from "@nestjs/common";
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
    console.log('User Info in controller')
    console.dir(userInfo) 
    const userInSABC  = this.service.getUser(userInfo.userName);
    console.log('returning checkuser controller')
    console.dir(userInSABC)
    //TO:DO Give a 404 if the user doesnt exit?
    return userInSABC
  }

  //@Res response: Response
  @Patch("/sync-user")
  synchronizeUserInfo(@Req() request: Request) {
    const userInfoBCServiceCard = this.authService.parseAuthorizationHeader(
      request.headers.authorization
    )
    console.log(`Controller endpoint to sync user info called`)    
    const syncedUser = this.service.synchronizeUserInfo(userInfoBCServiceCard);
    console.log('Returning syncedUser from Controller')
    console.dir(syncedUser);
    return syncedUser
  }
}
