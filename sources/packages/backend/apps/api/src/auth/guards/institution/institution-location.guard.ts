import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { IInstitutionUserToken } from "../..";
import { AuthorizedParties } from "../../authorized-parties.enum";
import {
  HasLocationAccessParam,
  HAS_LOCATION_ACCESS_KEY,
} from "../../decorators";

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
    const userToken = user as IInstitutionUserToken;
    /**
     * When a controller is shared between more then one client type(e.g Institution and Ministry)
     * following logic ensures that location access is checked only for Institution user.
     * For client types except Institution, this decorator will not validate anything.
     */
    if (userToken.azp !== AuthorizedParties.institution) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const locationId = parseInt(
      request.params[hasLocationUserType.locationIdParamName],
    );

    if (!userToken.authorizations.hasLocationAccess(locationId)) {
      return false;
    }

    if (hasLocationUserType.userType) {
      const hasSomeAccess = hasLocationUserType.userType.some((userType) =>
        userToken.authorizations.hasLocationUserType(locationId, userType),
      );
      if (!hasSomeAccess) {
        return false;
      }
    }

    if (hasLocationUserType.userRoles) {
      const hasSomeRole = hasLocationUserType.userRoles.some((role) =>
        userToken.authorizations.hasLocationRole(locationId, role),
      );
      if (!hasSomeRole) {
        return false;
      }
    }

    return true;
  }
}
