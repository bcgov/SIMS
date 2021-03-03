import { Catch, ArgumentsHost } from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";
import { Request } from "express";
import { Loggable, LoggerEnable } from "./common";
import { LoggerService } from "./logger/logger.service";

@Catch()
@LoggerEnable()
export class AppAllExceptionsFilter
  extends BaseExceptionFilter
  implements Loggable {
  catch(exception: unknown, host: ArgumentsHost) {
    // TODO: Customize error response
    const ctx = host.switchToHttp();
    const request: Request = ctx.getRequest();

    // Logging Additional info
    this.logger().error("Un-handle exception");
    this.logger().error(`Request Path [${request.path}]`);

    // Calling super
    super.catch(exception, host);
  }

  logger(): LoggerService | undefined {
    return;
  }
}
