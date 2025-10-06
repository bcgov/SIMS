import { Catch, ArgumentsHost, Inject, Injectable } from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";
import { Request } from "express";
import { LoggerService } from "@sims/utilities/logger";

@Catch()
@Injectable()
export class AppAllExceptionsFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request: Request = ctx.getRequest();
    // Logging Additional info.
    this.logger.error(
      `Unhandled exception, request path: ${request.path}`,
      exception,
    );
    // Calling super.
    super.catch(exception, host);
  }

  @Inject(LoggerService)
  logger: LoggerService;
}
