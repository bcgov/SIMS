import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY, RequiresUserAccount } from "../decorators";
import { IUserToken } from "apps/api/src/auth/userToken.interface";

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
      throw new UnauthorizedException(
        "No user account has been associated to the user token.",
      );
    }

    return true;
  }
}
