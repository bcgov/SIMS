import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { GROUPS_KEY } from "../decorators";
import { UserGroups } from "../user-groups.enum";
import { IUserToken } from "../userToken.interface";

/**
 * Allow the authorization based on groups making use
 * of the user object created on the request during the
 * authentication process on JwtStrategy validate method.
 */
@Injectable()
export class GroupsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredGroups = this.reflector.getAllAndOverride<UserGroups[]>(
      GROUPS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredGroups) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    const userToken = user as IUserToken;
    // Check if the user has any of the groups required to have access to the resource.
    return requiredGroups.some((group: string) =>
      userToken.groups?.includes(group),
    );
  }
}
