import { BullModuleOptions } from "@nestjs/bull";
import { Queues, QUEUE_PREFIX } from "../constants/queue.constant";

/**
 * Builds the bull module options to register queues in a dynamic wau.
 * @returns bull module options with all existing queues.
 */
export const getQueueModules = (): BullModuleOptions[] => {
  return Object.values(Queues).map<BullModuleOptions>((queue) => ({
    name: queue.name,
    prefix: QUEUE_PREFIX,
  }));
};
