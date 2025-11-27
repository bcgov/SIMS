import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ServiceUnavailableException,
} from "@nestjs/common";
import { AuthorizedParties, IUserToken } from "..";
import { ConfigService } from "@sims/utilities/config";

/**
 * Inspect the configuration and token to check if the system is in maintenance mode for the authorized party.
 */
@Injectable()
export class MaintenanceModeGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();
    const userToken = user as IUserToken;
    const isMaintenanceMode = this.isMaintenanceMode(userToken.azp);
    if (isMaintenanceMode) {
      throw new ServiceUnavailableException(
        "Service temporarily unavailable for maintenance. Please try again later or contact support if the issue persists.",
      );
    }

    return true;
  }

  /**
   * Determines if the authorized party is allowed under maintenance mode.
   * @param authorizedParty authorized party type to be checked.
   * @returns true if maintenance mode is on for authorized party.
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
