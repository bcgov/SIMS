import { BullModuleOptions } from "@nestjs/bull";
import { Queues, QUEUE_PREFIX } from "../constants/queue.constant";

export const getQueueModules = (): BullModuleOptions[] => {
  return Object.values(Queues).map<BullModuleOptions>((queue) => ({
    name: queue.name,
    prefix: QUEUE_PREFIX,
  }));
};
