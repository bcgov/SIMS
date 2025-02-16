import { Controller, HttpStatus, Post, Res } from "@nestjs/common";
import BaseController from "../BaseController";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { UserGroups } from "../../auth/user-groups.enum";
import { AllowAuthorizedParty, UserToken, Groups } from "../../auth/decorators";
import { IUserToken } from "../../auth/userToken.interface";
import { ClientTypeBaseRoute } from "../../types";
import { Response } from "express";
import { ApiTags } from "@nestjs/swagger";
import { JwtService } from "@nestjs/jwt";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("queues-dashboard")
@ApiTags(`${ClientTypeBaseRoute.AEST}-queues-dashboard`)
export class QueuesDashboardESTController extends BaseController {
  constructor(private jwtService: JwtService) {
    super();
  }

  @Post("authenticate")
  async authenticate(
    @UserToken() userToken: IUserToken,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const signedToken = this.jwtService.sign(
      {
        username: userToken.userName,
      },
      {
        secret: "MY_SECRET_KEY_TO_BE_CHANGED",
        expiresIn: "60s",
      },
    );
    // TODO: Add configurations for local and prod.
    response.cookie("queues-dashboard-auth", signedToken, {
      httpOnly: true,
      //secure: true, // Ensures the cookie is only sent over HTTPS
      sameSite: "lax",
      expires: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Example: 24-hour expiry
    });
    response.status(HttpStatus.CREATED).send("Queues-dashboard authenticated.");
  }
}
