import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { InstitutionUserAuthorizations } from "../../services/institution-user-auth/institution-user-auth.models";
import { IS_INSTITUTION_ADMIN_KEY } from "../decorators/institution-admin.decorator";
import { InstitutionUserRoles } from "../user-types.enum";

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
