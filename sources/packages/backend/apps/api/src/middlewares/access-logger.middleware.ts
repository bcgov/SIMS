import { Injectable, NestMiddleware } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { IUserToken } from "../auth";
import { getClientIPFromRequest } from "../utilities";
import { Request, Response, NextFunction } from "express";
import { LoggerService } from "@sims/utilities/logger";

@Injectable()
export class AccessLoggerMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly logger: LoggerService,
  ) {}
  /**
   * Logs access information of every request.
   * @param request http request.
   * @param _response http response.
   * @param next next function.
   */
  use(request: Request, _response: Response, next: NextFunction) {
    const { headers, originalUrl, method } = request;
    const clientIP = getClientIPFromRequest(request);
    const user = this.getUserFromBearerToken(request.headers.authorization);
    const userGUID = user?.userName ? user.userName : "User GUID not found";
    const userAgent = headers["user-agent"] ?? "User agent not found";
    const userAccessLogs: string[] = [];
    userAccessLogs.push(`Request - ${method} ${originalUrl} From ${clientIP}`);
    userAccessLogs.push(`User GUID: ${userGUID}`);
    if (user?.client_id) {
      userAccessLogs.push(`Client ID: ${user.client_id}`);
    }
    userAccessLogs.push(`User Agent: ${userAgent}`);
    const userAccessLog = userAccessLogs.join(" | ");
    this.logger.log(userAccessLog);
    next();
  }

  /**
   * Get decoded user information from bearer token.
   * @param bearerToken token to be decoded.
   * @returns decoded user information.
   */
  private getUserFromBearerToken(bearerToken: string): IUserToken | null {
    if (!bearerToken) {
      return null;
    }
    const user = this.jwtService.decode<IUserToken>(
      bearerToken.replace("Bearer ", ""),
    );
    return user;
  }
}
