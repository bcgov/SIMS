import { QueueModel } from "../model/queue.model";

/**
 * Constant which holds the collection of all the queues.
 * Any queue which is a part of application must be added here.
 * Queue modules and bull dashboard use this value to dynamically register the queues.
 */
export const Queues: Record<string, QueueModel> = {
  StartApplicationAssessment: {
    name: "start-application-assessment",
  },
};

export const QUEUE_PREFIX = "{sims}";
