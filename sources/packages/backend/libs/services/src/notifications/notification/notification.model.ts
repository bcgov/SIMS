import { NotificationMessageType } from "@sims/sims-db";
import { EntityManager } from "typeorm";

export interface SaveNotificationModel {
  userId?: number;
  messageType: NotificationMessageType;
  messagePayload: unknown;
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
   * Optional repository that can be provided, for instance,
   * to execute the command as part of an existing transaction. If not provided
   * the local repository will be used instead.
   */
  entityManager?: EntityManager;
}

export interface StudentNotification {
  givenNames: string;
  lastName: string;
  toAddress: string;
  userId: number;
}
