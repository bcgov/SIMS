import {
  HttpStatus,
  Injectable,
  LoggerService,
  NestMiddleware,
  UnauthorizedException,
} from "@nestjs/common";
import { JsonWebTokenError, JwtService, TokenExpiredError } from "@nestjs/jwt";
import { InjectLogger } from "@sims/utilities/logger";
import { NextFunction, Request, Response } from "express";

@Injectable()
export class BullDashboardAuthMiddleware implements NestMiddleware {
  constructor(private jwtService: JwtService) {}

  use(request: Request, response: Response, next: NextFunction) {
    const token = request.cookies["queues-dashboard-auth"];
    if (!token) {
      response
        .status(HttpStatus.UNAUTHORIZED)
        .send("Authentication cookie not found.");
    }
    try {
      const user = this.jwtService.verify(token, {
        secret: "MY_SECRET_KEY_TO_BE_CHANGED",
      });
      this.logger.log(`Queues-dashboard authenticated user ${user.username}`);
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException("Token expired.");
      } else if (error instanceof JsonWebTokenError) {
        throw new UnauthorizedException("Invalid token.");
      } else {
        throw new UnauthorizedException("Authentication failed");
      }
    }
    next();
  }

  @InjectLogger()
  logger: LoggerService;
}
