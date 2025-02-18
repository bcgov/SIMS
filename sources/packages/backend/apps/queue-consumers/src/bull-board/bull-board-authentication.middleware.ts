import { Injectable, NestMiddleware } from "@nestjs/common";
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
import { QueueDashboardToken } from "@sims/auth/services";
import { ConfigService } from "@sims/utilities/config";
import { InjectLogger, LoggerService } from "@sims/utilities/logger";
import { HttpStatusCode } from "axios";
import { NextFunction, Request, Response } from "express";

@Injectable()
export class BullBoardAuthenticationMiddleware implements NestMiddleware {
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
   * @param response express response object.
   * @param next next function to be called after this middleware.
   * @throws UnauthorizedException when the token is missing, expired or invalid.
   */
  use(request: Request, response: Response, next: NextFunction): void {
    // Check if the cookie exists and get its content.
    const token = request.cookies[QUEUE_DASHBOARD_AUTH_COOKIE];
    if (!token) {
      this.logAccess(request, {
        forbiddenError: "authentication cookie not found",
      });
      response
        .status(HttpStatusCode.Forbidden)
        .send(`Not possible to authenticate: authentication cookie not found.`);
      return;
    }
    let user: QueueDashboardToken;
    let forbiddenError: string;
    try {
      // Validate the JWT extracted from the cookie.
      user = this.jwtService.verify<QueueDashboardToken>(
        token,
        this.jwtVerifyOptions,
      );
      // Proceed if the validation was successful.
      next();
    } catch (error: unknown) {
      if (error instanceof TokenExpiredError) {
        forbiddenError = "token expired";
      } else if (error instanceof JsonWebTokenError) {
        forbiddenError = "invalid token";
      } else {
        forbiddenError = "authentication failed";
        // Only add an error log if the error in unknown.
        this.logger.error("Queues dashboard authentication error.", error);
      }
      response
        .status(HttpStatusCode.Forbidden)
        .send(`Not possible to authenticate: ${forbiddenError}.`);
    } finally {
      this.logAccess(request, { userGuid: user.sub, forbiddenError });
    }
  }

  /**
   * Logs access information of every request considering an
   * authenticated user or not.
   * @param request express request object.
   * @param options log options.
   * - `userGuid` optional user GUID from the authentication token.
   * - `forbiddenError` forbidden error.
   */
  private logAccess(
    request: Request,
    options?: {
      userGuid?: string;
      forbiddenError?: string;
    },
  ): void {
    // TODO: reuse some code from API.
    const userAccessLogs: string[] = [];
    const { originalUrl, method } = request;
    const clientIP =
      (request.headers["x-forwarded-for"] as string) ??
      request.socket.remoteAddress;
    const userAccessLog = `Request - ${method} ${originalUrl} From ${clientIP}`;
    userAccessLogs.push(userAccessLog);
    if (options?.userGuid) {
      userAccessLogs.push(`User GUID: ${options?.userGuid}`);
    }
    if (options?.forbiddenError) {
      userAccessLogs.push(`Forbidden error: ${options.forbiddenError}.`);
    }
    const logMessage = userAccessLogs.join(" | ");
    if (options?.forbiddenError) {
      this.logger.error(logMessage);
    } else {
      this.logger.log(logMessage);
    }
  }

  @InjectLogger()
  logger: LoggerService;
}
