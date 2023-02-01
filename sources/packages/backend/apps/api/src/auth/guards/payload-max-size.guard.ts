import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PAYLOAD_MAX_SIZE_KEY } from "../decorators/payload-max-size.decorator";

/**
 * This guard checks the payload to ensure it is not greater than the max size.
 */
@Injectable()
export class PayloadMaxSizeGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  /**
   * Implementation of canActivate method in CanActivate.
   * Checks if the payload is not greater than max size.
   * @param context Execution context.
   * @returns true if payload length is not greater than the max size.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const payloadMaxSize = this.reflector.getAllAndOverride<any>(
      PAYLOAD_MAX_SIZE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!payloadMaxSize) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    if (request.socket.bytesRead > payloadMaxSize) {
      throw new BadRequestException("Invalid request. Payload is too large.");
    }
  }
}
