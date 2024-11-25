import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY, RequiresUserAccount } from "../decorators";
import { IUserToken } from "apps/api/src/auth/userToken.interface";
import { MISSING_USER_ACCOUNT } from "../../constants";
import { ApiProcessError } from "../../types";

/**
 * Validates that a user account must be already created in order to access a route.
 * Public routes and routes that do not require a user account are skipped.
 */
@Injectable()
export class RequiresUserAccountGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if the route is public.
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    // If the route is public, no validation is required.
    if (isPublic) {
      return true;
    }

    const requiresUserAccount = this.reflector.getAllAndOverride(
      RequiresUserAccount,
      [context.getHandler(), context.getClass()],
    );

    if (requiresUserAccount === false) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    const userToken = user as IUserToken;

    if (!userToken?.userId) {
      throw new ForbiddenException(
        new ApiProcessError(
          "No user account has been associated to the user token.",
          MISSING_USER_ACCOUNT,
        ),
      );
    }

    return true;
  }
}
