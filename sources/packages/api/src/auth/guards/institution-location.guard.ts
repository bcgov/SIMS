import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { InstitutionUserAuthorizations } from "../../services/institution-user-auth/institution-user-auth.models";
import {
  HasLocationAccessParam,
  HAS_LOCATION_ACCESS_KEY,
} from "../decorators/institution-location.decorator";

@Injectable()
export class InstitutionLocationGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const hasLocationUserType =
      this.reflector.getAllAndOverride<HasLocationAccessParam>(
        HAS_LOCATION_ACCESS_KEY,
        [context.getHandler(), context.getClass()],
      );

    if (!hasLocationUserType) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    const authorizations = user.authorizations as InstitutionUserAuthorizations;

    const request = context.switchToHttp().getRequest();
    const locationId = parseInt(
      request.params[hasLocationUserType.locationIdParamName],
    );

    if (!user.authorizations.hasLocationAccess(locationId)) {
      return false;
    }

    if (hasLocationUserType.userType) {
      const hasSomeAccess = hasLocationUserType.userType.some((userType) =>
        authorizations.hasLocationUserType(locationId, userType),
      );
      if (!hasSomeAccess) {
        return false;
      }
    }

    if (hasLocationUserType.userRoles) {
      const hasSomeRole = hasLocationUserType.userRoles.some((role) =>
        authorizations.hasLocationRole(locationId, role),
      );
      if (!hasSomeRole) {
        return false;
      }
    }

    return true;
  }
}
