import { CustomDecorator, SetMetadata } from "@nestjs/common";

/**
 * Metadata key for the maintenance mode bypass decorator.
 * Used to mark endpoints that should remain accessible during maintenance mode.
 */
export const ALLOW_DURING_MAINTENANCE_MODE_KEY = "allowDuringMaintenanceMode";

/**
 * Decorator that allows a route to be accessed even when maintenance mode is active.
 * Use this on endpoints that need to remain available during maintenance, such as health or config endpoints.
 * @returns A NestJS metadata decorator that marks the route for maintenance mode bypass.
 */
export const AllowDuringMaintenanceMode = (): CustomDecorator =>
  SetMetadata(ALLOW_DURING_MAINTENANCE_MODE_KEY, true);
