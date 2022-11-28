import { QueueModel } from "../model/queue.model";

export enum QueueNames {
  StartApplicationAssessment = "start-application-assessment",
}

/**
 * Constant which holds the collection of all the queues.
 * Any queue which is a part of application must be added here.
 * Queue modules and bull dashboard use this value to dynamically register the queues.
 */
export const Queues: QueueModel[] = [
  {
    name: QueueNames.StartApplicationAssessment,
  },
];

export const QUEUE_PREFIX = "{sims}";
