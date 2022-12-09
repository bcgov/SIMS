import { NotificationMessageType } from "@sims/sims-db";

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

export interface StudentNotification {
  givenNames: string;
  lastName: string;
  toAddress: string;
  userId: number;
}

export interface NotificationProcessingStatus {
  notificationsProcessed: number;
  notificationsSuccessfullyProcessed: number;
}
