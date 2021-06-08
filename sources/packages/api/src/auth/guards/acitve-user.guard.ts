import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ALLOW_INACTIVE_USER_KEY } from "../decorators/allow-inactive-user.decorator";
import { IUserToken } from "../userToken.interface";

/**
 * Block non-active users to have access to the API,
 * with some exceptions. Expections are allowed using
 * the decorator @AllowInactiveUser.
 */
@Injectable()
export class ActiveUserGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowInactiveAccess = this.reflector.getAllAndOverride<boolean>(
      ALLOW_INACTIVE_USER_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (allowInactiveAccess) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    const userToken = user as IUserToken;
    if (userToken?.isActive === false) {
      return false;
    }

    return true;
  }
}
