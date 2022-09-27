import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { InstitutionUserAuthorizations } from "../../services/institution-user-auth/institution-user-auth.models";
import { AuthorizedParties } from "../authorized-parties.enum";
import { IS_INSTITUTION_ADMIN_KEY } from "../decorators/institution-admin.decorator";
import { InstitutionUserRoles } from "../user-types.enum";

/**
 * Inspect the token to check if the user has institution admin rights.
 */
@Injectable()
export class InstitutionAdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const institutionAdminRoles = this.reflector.getAllAndOverride<
      InstitutionUserRoles[]
    >(IS_INSTITUTION_ADMIN_KEY, [context.getHandler(), context.getClass()]);

    if (!institutionAdminRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    /**
     * When a controller is shared between more then one client type(e.g Institution and Ministry)
     * following logic ensures that admin role checked only for Institution user.
     * For client types except Institution, this decorator will not validate anything.
     */
    if (user.authorizedParty !== AuthorizedParties.institution) {
      return true;
    }
    const authorizations = user.authorizations as InstitutionUserAuthorizations;

    if (!authorizations.isAdmin()) {
      return false;
    }

    if (institutionAdminRoles.length) {
      const hasSomeRole = institutionAdminRoles.some((role) =>
        authorizations.hasAdminRole(role),
      );
      if (!hasSomeRole) {
        return false;
      }
    }

    return true;
  }
}
