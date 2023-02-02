import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { GROUPS_KEY } from "../decorators";
import { AuthorizedParties, UserGroups, IUserToken } from "..";

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
    /**
     * When a controller is shared between more then one client type(e.g Institution and Ministry)
     * Following logic ensures that group check is done only for ministry(AEST) user.
     * For client types except AEST, this decorator will not validate anything.
     */
    if (userToken.azp !== AuthorizedParties.aest) {
      return true;
    }

    // Check if the user has any of the groups required to have access to the resource.
    // UserGroups 'aest/user/x' and 'aest/user' are valid, as they start with 'aest/user'
    // we are here looking for matches, not the exact string.
    return requiredGroups.some((group: string) =>
      userToken.groups?.some((userGroup) => userGroup.startsWith(group)),
    );
  }
}
