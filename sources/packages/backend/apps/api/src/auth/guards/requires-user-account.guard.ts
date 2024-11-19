import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RequiresUserAccount } from "apps/api/src/auth/decorators";
import { IUserToken } from "apps/api/src/auth/userToken.interface";

/**
 * Specifies when a student account must be already created in order to access a route.
 */
@Injectable()
export class RequiresUserAccountGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiresUserAccount = this.reflector.get(
      RequiresUserAccount,
      context.getHandler(),
    );

    if (requiresUserAccount === false) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    const userToken = user as IUserToken;

    if (!userToken?.userId) {
      throw new UnauthorizedException(
        "No user account has been associated to the user token.",
      );
    }

    return true;
  }
}
