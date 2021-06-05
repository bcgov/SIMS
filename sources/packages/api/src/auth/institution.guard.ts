import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { InstitutionUserAuthService } from "../services";
import {
  HasLocationAccessParam,
  HAS_LOCATION_ACCESS_KEY,
  IS_INSTITUTION_ADMIN_KEY,
} from "./decorators/institution.decorator";

@Injectable()
export class InstitutionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly institutionUserAuthService: InstitutionUserAuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiresInstitutionAdmin = this.reflector.getAllAndOverride<boolean>(
      IS_INSTITUTION_ADMIN_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (requiresInstitutionAdmin) {
      const { user } = context.switchToHttp().getRequest();
      const authorizations = await this.institutionUserAuthService.getAuthorizationsByUserName(
        user.userName,
      );

      if (!authorizations.isAdmin) {
        return false;
      }
    }

    const hasLocationUserType = this.reflector.getAllAndOverride<HasLocationAccessParam>(
      HAS_LOCATION_ACCESS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (requiresInstitutionAdmin) {
      const request = context.switchToHttp().getRequest();
      const authorizations = await this.institutionUserAuthService.getAuthorizationsByUserName(
        request.user.userName,
      );

      if (authorizations.isAdmin) {
        return true;
      }

      const locationId = parseInt(
        request.params[hasLocationUserType.locationIdParamName],
      );

      if (!authorizations.hasLocationAccess(locationId)) {
        return false;
      }

      if (hasLocationUserType.userType) {
        const hasSomeAccess = hasLocationUserType.userType.some((userType) =>
          authorizations.hasUserType(locationId, userType),
        );
        if (!hasSomeAccess) {
          return false;
        }
      }

      if (hasLocationUserType.userRoles) {
        const hasSomeRole = hasLocationUserType.userRoles.some((role) =>
          authorizations.hasRole(locationId, role),
        );
        if (!hasSomeRole) {
          return false;
        }
      }

      return true;
    }

    return true;
  }
}
