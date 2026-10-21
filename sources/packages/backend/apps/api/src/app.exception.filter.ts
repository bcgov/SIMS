import { Catch, ArgumentsHost, HttpException } from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";
import { Request } from "express";
import { LoggerService } from "@sims/utilities/logger";
import { IUserToken } from "./auth";
import { ApiProcessError } from "./types";
@Catch()
export class AppAllExceptionsFilter extends BaseExceptionFilter {
  constructor(private readonly logger: LoggerService) {
    super();
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const request: Request = host.switchToHttp().getRequest();
    const userInfo = `User: ${(request.user as IUserToken)?.userName ?? "not authenticated"}`;
    // If the exception is an API process error, then log the exception message and request details.
    if (exception instanceof HttpException) {
      const innerException = exception.getResponse();
      if (innerException instanceof ApiProcessError) {
        this.logger.warn(
          `API process exception: ${exception.message} | Request path: ${request.path} | ${userInfo}`,
        );
        super.catch(exception, host);
        return;
      }
    }
    // Log any exception that is not API process error as an unhandled exception with stack trace.
    this.logger.error(
      `Unhandled exception | Request path: ${request.path} | ${userInfo}`,
      exception,
    );
    super.catch(exception, host);
  }
}
