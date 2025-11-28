import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ServiceUnavailableException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthorizedParties, IUserToken } from "..";
import { ConfigService } from "@sims/utilities/config";
import { ALLOW_DURING_MAINTENANCE_MODE_KEY } from "../decorators/allow-during-maintenance-mode.decorator";

/**
 * Guard that prevents access to the API when the system or a specific client portal is in maintenance mode.
 * Maintenance mode is used during planned system upgrades, emergency fixes, or other periods when access must be restricted to ensure data integrity and user safety.
 * The guard checks both global maintenance mode and client-type-specific maintenance flags, and when triggered, throws a ServiceUnavailableException to inform users that the system is temporarily unavailable.
 */
@Injectable()
export class MaintenanceModeGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const allowDuringMaintenanceMode =
      this.reflector.getAllAndOverride<boolean>(
        ALLOW_DURING_MAINTENANCE_MODE_KEY,
        [context.getHandler(), context.getClass()],
      );

    // If the route has the allowed during maintenance mode decorator, bypass the guard.
    if (allowDuringMaintenanceMode) {
      return true;
    }

    // Get authorized party from the user token to determine maintenance mode status.
    const { user } = context.switchToHttp().getRequest();
    const userToken = user as IUserToken;
    if (this.isMaintenanceModeEnabled(userToken?.azp)) {
      throw new ServiceUnavailableException(
        "Service temporarily unavailable for maintenance. Please try again later or contact support if the issue persists.",
      );
    }

    return true;
  }

  /**
   * Determines if maintenance mode is enabled for the specified authorized party.
   * Checks global first, then client-type-specific flags.
   * @param authorizedParty authorized party type to be checked.
   * @returns True if maintenance mode is enabled, otherwise false.
   */
  private isMaintenanceModeEnabled(
    authorizedParty?: AuthorizedParties,
  ): boolean {
    // Check global maintenance mode first.
    if (this.configService.maintenanceMode) return true;
    // If no authorized party is provided, maintenance mode cannot be determined.
    if (!authorizedParty) return false;

    const partyFlags: Record<AuthorizedParties, boolean> = {
      [AuthorizedParties.student]: this.configService.maintenanceModeStudent,
      [AuthorizedParties.supportingUsers]:
        this.configService.maintenanceModeSupportingUser,
      [AuthorizedParties.institution]:
        this.configService.maintenanceModeInstitution,
      [AuthorizedParties.aest]: this.configService.maintenanceModeMinistry,
      [AuthorizedParties.external]: this.configService.maintenanceModeExternal,
    };

    return partyFlags[authorizedParty] ?? false;
  }
}
