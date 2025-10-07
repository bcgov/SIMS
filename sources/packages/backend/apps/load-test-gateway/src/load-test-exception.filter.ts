import { Catch, ArgumentsHost, Injectable } from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";
import { Request } from "express";
import { LoggerService } from "@sims/utilities/logger";

@Catch()
@Injectable()
export class LoadTestAllExceptionsFilter extends BaseExceptionFilter {
  constructor(private readonly logger: LoggerService) {
    super();
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request: Request = ctx.getRequest();

    // Logging Additional info.
    this.logger.error("Unhandled exception");
    this.logger.error(`Request path [${request.path}]`);
    this.logger.error(`${JSON.stringify(exception)}`);

    // Calling super.
    super.catch(exception, host);
  }
}
