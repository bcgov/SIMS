import { RegisterQueueOptions } from "@nestjs/bullmq";

export interface QueueModel extends Omit<RegisterQueueOptions, "connection"> {
  name: string;
  dashboardReadonly?: boolean;
  isActive: boolean;
  isScheduler?: boolean;
}
