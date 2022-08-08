import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthorizedParties } from "../authorized-parties.enum";
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
    /**
     * When a controller is shared between more then one client type(e.g Institution and Ministry)
     * Following logic ensures that group check is done only for ministry(AEST) user.
     * For client types except AEST, this decorator will not validate anything.
     */
    if (user.authorizedParty !== AuthorizedParties.aest) {
      return true;
    }
    const userToken = user as IUserToken;
    // Check if the user has any of the groups required to have access to the resource.
    // UserGroups 'aest/user/x' and 'aest/user' are valid, we are here looking for matches, not the exact string.
    return requiredGroups.some((group: string) =>
      userToken.groups?.some((userGroup) => userGroup.startsWith(group)),
    );
  }
}
