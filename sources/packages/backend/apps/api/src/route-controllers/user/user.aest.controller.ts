import {
  BadRequestException,
  Controller,
  Get,
  HttpStatus,
  Post,
  Put,
  Res,
} from "@nestjs/common";
import { UserService } from "../../services";
import BaseController from "../BaseController";
import { UserToken } from "../../auth/decorators/userToken.decorator";
import { IUserToken } from "../../auth/userToken.interface";
import { BCeIDAccountsAPIOutDTO } from "./models/bceid-accounts.dto";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { UserGroups } from "../../auth/user-groups.enum";
import {
  AllowAuthorizedParty,
  Groups,
  RequiresUserAccount,
} from "../../auth/decorators";
import { ApiTags, ApiUnprocessableEntityResponse } from "@nestjs/swagger";
import { UserControllerService } from "..";
import { ApiProcessError, ClientTypeBaseRoute } from "../../types";
import { MISSING_USER_INFO } from "../../constants";
import { CookieOptions, Response } from "express";
import { QueueDashboardToken } from "@sims/auth/services/queues-dashboard/queue-dashboard.models";
import {
  QUEUE_DASHBOARD_AUDIENCE,
  QUEUE_DASHBOARD_ISSUER,
} from "@sims/auth/constants";
import { ConfigService } from "@sims/utilities/config";
import { JwtService } from "@nestjs/jwt";
import * as dayjs from "dayjs";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("user")
@ApiTags(`${ClientTypeBaseRoute.AEST}-user`)
export class UserAESTController extends BaseController {
  constructor(
    private readonly userService: UserService,
    private readonly userControllerService: UserControllerService,
    private jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  /**
   * Retrieves business BCeIDs accounts managed by the user.
   * @param userToken authenticated user token.
   * @returns BCeID accounts managed by the user.
   */
  @ApiUnprocessableEntityResponse({
    description:
      "Not able to retrieve BCeID business account details for the current authenticated user.",
  })
  @Get("bceid-accounts")
  getAllBCeIDs(
    @UserToken() userToken: IUserToken,
  ): Promise<BCeIDAccountsAPIOutDTO> {
    return this.userControllerService.getAllBCeIDs(userToken);
  }

  /**
   * Creates or updates Ministry user information.
   * @param userToken user token information to be updated.
   */
  @RequiresUserAccount(false)
  @Put()
  async syncAESTUser(@UserToken() userToken: IUserToken): Promise<void> {
    // If the user token is missing any of the primary user information to create a user
    // then throw an error.
    if (
      !userToken.userName?.trim() ||
      !userToken.email?.trim() ||
      !userToken.lastName?.trim()
    ) {
      throw new BadRequestException(
        new ApiProcessError(
          "User token is missing primary user information.",
          MISSING_USER_INFO,
        ),
      );
    }
    await this.userService.syncUser(
      userToken.userName,
      userToken.email,
      userToken.givenNames,
      userToken.lastName,
    );
  }

  @Post("queue-admin-token-exchange")
  async queueAdminTokenExchange(
    @UserToken() userToken: IUserToken,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    // Exchange token creation.
    const queueDashboardToken = {
      iss: QUEUE_DASHBOARD_ISSUER,
      sub: userToken.userName,
      aud: QUEUE_DASHBOARD_AUDIENCE,
    } as QueueDashboardToken;
    const tokenExpiresIn =
      this.configService.queueDashboardAccess.tokenExpirationSeconds;
    const signedToken = this.jwtService.sign(queueDashboardToken, {
      secret: this.configService.queueDashboardAccess.tokenSecret,
      expiresIn: tokenExpiresIn,
    });
    // Cookie creation to store the exchange token.
    const cookieExpires = dayjs().add(tokenExpiresIn, "seconds").toDate();
    const cookieOptions: CookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      expires: cookieExpires,
    };
    if (process.env.NODE_ENV !== "production") {
      cookieOptions.secure = false;
      cookieOptions.sameSite = "lax";
    }
    // Save the exchange token in a cookie to sent and stored in the client.
    response.cookie("queues-dashboard-auth", signedToken, cookieOptions);
    response.status(HttpStatus.CREATED).send("Queues-dashboard authenticated.");
  }
}
