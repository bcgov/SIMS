import { BullModuleOptions } from "@nestjs/bull";
import { Queues } from "../constants/queue.constant";

export const getQueueModules = (): BullModuleOptions[] => {
  return Object.values(Queues).map((queue) => ({
    name: queue.name,
  }));
};
