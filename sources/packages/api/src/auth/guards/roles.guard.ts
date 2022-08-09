import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../decorators/roles.decorator";
import { Role } from "../roles.enum";
import { IUserToken } from "../userToken.interface";

/**
 * Allow the authorization based on roles making use
 * of the user object created on the request during the
 * authentication process on JwtStrategy validate method.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    const userToken = user as IUserToken;
    if (userToken.resource_access && userToken.authorizedParty) {
      const userRoles =
        userToken.resource_access[userToken.authorizedParty].roles;
      return requiredRoles.some((role) => userRoles?.includes(role));
    }
    return false;
  }
}
