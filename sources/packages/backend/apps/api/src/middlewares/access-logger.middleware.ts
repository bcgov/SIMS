import { Injectable, LoggerService, NestMiddleware } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectLogger } from "@sims/utilities/logger";
import { IUserToken } from "../auth";
import { getClientIPFromRequest } from "../utilities";
import { Request, Response, NextFunction } from "express";

@Injectable()
export class AccessLoggerMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}
  use(request: Request, _response: Response, next: NextFunction) {
    const { headers, originalUrl, method } = request;
    const clientIP = getClientIPFromRequest(request);
    const user = this.getUserFromBearerToken(request.headers.authorization);
    const userGUID = user ? user.userName : "User GUID not found";
    const userAgent = headers["user-agent"] ?? "User agent not found";
    const userAccessLog = `Request - ${method} ${originalUrl} From ${clientIP} | User GUID: ${userGUID} | User Agent: ${userAgent}`;
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
  @InjectLogger()
  logger: LoggerService;
}
