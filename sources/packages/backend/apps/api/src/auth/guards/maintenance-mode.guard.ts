import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ServiceUnavailableException,
} from "@nestjs/common";
import { AuthorizedParties, IUserToken } from "..";
import { ConfigService } from "@sims/utilities/config";

/**
 * Guard that prevents access to the API when the system or a specific client portal is in maintenance mode.
 * Maintenance mode is used during planned system upgrades, emergency fixes, or other periods when access must be restricted to ensure data integrity and user safety.
 * The guard checks both global maintenance mode and client-type-specific maintenance flags, and when triggered, throws a ServiceUnavailableException to inform users that the system is temporarily unavailable.
 */
@Injectable()
export class MaintenanceModeGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();
    const userToken = user as IUserToken;
    const isMaintenanceMode = this.isMaintenanceMode(userToken?.azp);
    if (isMaintenanceMode) {
      throw new ServiceUnavailableException(
        "Service temporarily unavailable for maintenance. Please try again later or contact support if the issue persists.",
      );
    }

    return true;
  }

  /**
   * Determines if maintenance mode is enabled for the specified authorized party.
   * @param authorizedParty Authorized party type to be checked.
   * @returns True if maintenance mode is enabled for the authorized party, otherwise false.
   */
  private isMaintenanceMode(authorizedParty: AuthorizedParties): boolean {
    // global maintenance mode
    if (this.configService.maintenanceMode) {
      return true;
    }
    switch (authorizedParty) {
      case AuthorizedParties.student:
        return this.configService.maintenanceModeStudent;
      case AuthorizedParties.supportingUsers:
        return this.configService.maintenanceModeSupportingUser;
      case AuthorizedParties.institution:
        return this.configService.maintenanceModeInstitution;
      case AuthorizedParties.aest:
        return this.configService.maintenanceModeMinistry;
      case AuthorizedParties.external:
        return this.configService.maintenanceModeExternal;
      default:
        return false;
    }
  }
}
