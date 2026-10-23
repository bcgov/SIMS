import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { IInstitutionUserToken, InstitutionUserRoles } from "../..";
import { IS_INSTITUTION_ADMIN_KEY } from "../../decorators/institution/institution-admin.decorator";

/**
 * Inspect the token to check if the user has institution admin rights.
 */
@Injectable()
export class InstitutionAdminGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const institutionAdminRoles = this.reflector.getAllAndOverride<
      InstitutionUserRoles[]
    >(IS_INSTITUTION_ADMIN_KEY, [context.getHandler(), context.getClass()]);

    if (!institutionAdminRoles) {
      return true;
    }

    const { user }: { user: IInstitutionUserToken } = context
      .switchToHttp()
      .getRequest();
    // Only institution tokens have authorizations.
    const authorizations = user?.authorizations;

    if (!authorizations?.isAdmin()) {
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
