import { NotificationMessageType } from "@sims/sims-db";
import { EntityManager } from "typeorm";

export interface SaveNotificationModel {
  userId?: number;
  messageType: NotificationMessageType;
  messagePayload: {
    email_address: string;
    template_id: string;
  };
}

export interface StudentFileUploadNotification {
  firstName: string;
  lastName: string;
  birthDate: Date;
  applicationNumber?: string;
  documentPurpose: string;
  userId: number;
}

export interface MinistryStudentFileUploadNotification {
  firstName: string;
  lastName: string;
  toAddress: string;
  userId: number;
}

export interface StudentRestrictionAddedNotification {
  givenNames: string;
  lastName: string;
  toAddress: string;
  userId: number;
}

export interface StudentRestrictionAddedNotificationOptions {
  /**
   * When set to false or not defined (default option) will send the message right away,
   * otherwise, the message will be added to a queue to be sent later.
   */
  notificationsDelayed?: boolean;
  /**
   * Optional repository that can be provided, for instance,
   * to execute the command as part of an existing transaction. If not provided
   * the local repository will be used instead.
   */
  entityManager?: EntityManager;
}
