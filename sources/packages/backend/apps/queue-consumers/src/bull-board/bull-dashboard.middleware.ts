import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from "@nestjs/common";
import {
  JsonWebTokenError,
  JwtService,
  JwtVerifyOptions,
  TokenExpiredError,
} from "@nestjs/jwt";
import {
  QUEUE_DASHBOARD_AUDIENCE,
  QUEUE_DASHBOARD_AUTH_COOKIE,
  QUEUE_DASHBOARD_ISSUER,
} from "@sims/auth/constants";
import { QueueDashboardToken } from "@sims/auth/services/queues-dashboard/queue-dashboard.models";
import { ConfigService } from "@sims/utilities/config";
import { InjectLogger, LoggerService } from "@sims/utilities/logger";
import { NextFunction, Request, Response } from "express";

@Injectable()
export class BullDashboardAuthMiddleware implements NestMiddleware {
  /**
   * JWT configuration used to validate the token.
   */
  private readonly jwtVerifyOptions: JwtVerifyOptions;

  constructor(
    private readonly jwtService: JwtService,
    configService: ConfigService,
  ) {
    this.jwtVerifyOptions = {
      secret: configService.queueDashboardAccess.tokenSecret,
      issuer: QUEUE_DASHBOARD_ISSUER,
      audience: QUEUE_DASHBOARD_AUDIENCE,
      ignoreExpiration: false,
    };
  }

  /**
   * Checks if the user has a valid authentication cookie, verifies it
   * and logs the user if the token is valid.
   * @param request express request object.
   * @param _response express response object.
   * @param next next function to be called after this middleware.
   * @throws UnauthorizedException when the token is missing, expired or invalid.
   */
  use(request: Request, _response: Response, next: NextFunction) {
    const token = request.cookies[QUEUE_DASHBOARD_AUTH_COOKIE];
    if (!token) {
      throw new UnauthorizedException("Authentication cookie not found.");
    }
    try {
      const user = this.jwtService.verify(
        token,
        this.jwtVerifyOptions,
      ) as QueueDashboardToken;
      this.logger.log(`Queues-dashboard authenticated user ${user.sub}`);
    } catch (error: unknown) {
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException("Token expired.");
      }
      if (error instanceof JsonWebTokenError) {
        throw new UnauthorizedException("Invalid token.");
      }
      this.logger.error("Queues dashboard authentication error.", error);
      throw new UnauthorizedException("Authentication failed.");
    }
    next();
  }

  @InjectLogger()
  logger: LoggerService;
}
