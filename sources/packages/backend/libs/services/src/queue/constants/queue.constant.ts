import { QueueModel } from "../model/queue.model";

export enum QueueNames {
  StartApplicationAssessment = "start-application-assessment",
  SendEmailNotification = "send-email-notification",
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
  { name: QueueNames.SendEmailNotification },
];
