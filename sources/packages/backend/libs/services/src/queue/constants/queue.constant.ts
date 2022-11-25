import { QueueModel } from "../model/queue.model";

/**
 * Constant which holds the collection of all the queues.
 * Any queue which is a part of application must be added here.
 * Queue modules and bull dashboard use this value to dynamically register the queues.
 */
export const Queues: QueueModel[] = [
  {
    name: "start-application-assessment",
  },
];

export const QUEUE_PREFIX = "{sims}";

export enum QueueNames {
  StartApplicationAssessment = "start-application-assessment",
}
