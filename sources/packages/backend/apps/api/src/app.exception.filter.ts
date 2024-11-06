import { Catch, ArgumentsHost } from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";
import { Request } from "express";
import { LoggerService, InjectLogger } from "@sims/utilities/logger";

@Catch()
export class AppAllExceptionsFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request: Request = ctx.getRequest();

    // Logging Additional info
    this.logger.error(
      `Unhandled exception, request path: ${request.path}`,
      exception,
    );

    // Calling super
    super.catch(exception, host);
  }

  @InjectLogger()
  logger: LoggerService;
}
