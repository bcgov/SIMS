import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  LoggerService,
} from "@nestjs/common";
import { InjectLogger } from "@sims/utilities/logger";
import { IUserToken } from "../auth";
import { CLIENT_IP_HEADER_NAME } from "../utilities";
import { Observable } from "rxjs";

/**
 * access logging details from request.
 */
interface AccessLoggingRequest {
  user: IUserToken;
  headers: Record<string, string>;
  method: string;
  url: string;
  socket: { remoteAddress: string };
}

/**
 * Application access log interceptor.
 */
@Injectable()
export class AccessLoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const accessLoggingRequest = context
      .switchToHttp()
      .getRequest() as AccessLoggingRequest;
    // Root API url path.
    const healthCheckHandlerRoot = "/health";
    const isHealthCheckRequest = accessLoggingRequest.url.includes(
      healthCheckHandlerRoot,
    );
    // Log access details only for API requests to handlers excluding health check API calls.
    if (!isHealthCheckRequest) {
      this.logAccessDetails(accessLoggingRequest);
    }
    return next.handle();
  }

  /**
   * Log access details.
   * @param accessLoggingRequest access logging details from request.
   */
  private logAccessDetails(accessLoggingRequest: AccessLoggingRequest) {
    const { headers, socket, url, method, user } = accessLoggingRequest;
    const clientIP = headers[CLIENT_IP_HEADER_NAME] ?? socket.remoteAddress;
    const userGUID = user ? user.userName : "User GUID not found";
    const userAgent = headers["user-agent"] ?? "User agent not found";
    const userAccessLog = `Request - ${method} ${url} From ${clientIP} | User GUID: ${userGUID} | User Agent: ${userAgent}`;
    this.logger.log(userAccessLog);
  }
  @InjectLogger()
  logger: LoggerService;
}
