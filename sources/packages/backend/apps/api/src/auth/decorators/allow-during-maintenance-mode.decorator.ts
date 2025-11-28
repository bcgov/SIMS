import { CustomDecorator, SetMetadata } from "@nestjs/common";

export const ALLOW_DURING_MAINTENANCE_MODE_KEY = "allowDuringMaintenanceMode";
export const AllowDuringMaintenanceMode = (): CustomDecorator =>
  SetMetadata(ALLOW_DURING_MAINTENANCE_MODE_KEY, true);
