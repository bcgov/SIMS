import { Catch, ArgumentsHost } from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";
import { Request } from "express";
import { InjectLogger } from "./common";
import { LoggerService } from "./logger/logger.service";

@Catch()
export class AppAllExceptionsFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // TODO: Customize error response
    const ctx = host.switchToHttp();
    const request: Request = ctx.getRequest();

    // Logging Additional info
    this.logger.error("Un-handle exception");
    this.logger.error(`Request Path [${request.path}]`);
    this.logger.error(`Exception Details: \n ***** \n\t${exception} \n *****`);

    // Calling super
    super.catch(exception, host);
  }

  @InjectLogger()
  logger: LoggerService;
}
