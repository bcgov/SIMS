import { BullModuleOptions } from "@nestjs/bull";

export interface QueueModel extends Omit<BullModuleOptions, "redis"> {
  name: string;
  dashboardReadonly?: boolean;
  isActive?: boolean;
  isScheduler?: boolean;
}
