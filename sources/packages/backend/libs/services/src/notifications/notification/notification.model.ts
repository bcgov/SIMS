import { NotificationMessageType } from "@sims/sims-db";
import { NotificationEmailMessage } from "./gc-notify.model";

export interface SaveNotificationModel {
  userId?: number;
  messageType: NotificationMessageType;
  messagePayload: NotificationEmailMessage;
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

export interface MSFAACancellationNotification {
  givenNames: string;
  lastName: string;
  toAddress: string;
  userId: number;
}

export interface ApplicationOfferingChangeRequestInProgressWithStudentNotification {
  givenNames: string;
  lastName: string;
  toAddress: string;
  userId: number;
}

export interface ApplicationOfferingChangeRequestCompleteNotification {
  givenNames: string;
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

export interface LegacyRestrictionAddedNotification {
  firstName: string;
  lastName: string;
  email: string;
  birthDate: Date;
  userId: number;
}

export interface StudentNotification {
  givenNames: string;
  lastName: string;
  toAddress: string;
  userId: number;
}

export interface DisbursementBlockedNotificationForStudent {
  givenNames: string;
  lastName: string;
  email: string;
}

export interface DisbursementBlockedNotificationForMinistry {
  givenNames: string;
  lastName: string;
  email: string;
  dob: string;
  applicationNumber: string;
}

export interface NotificationProcessingSummary {
  notificationsProcessed: number;
  notificationsSuccessfullyProcessed: number;
}

export interface ECEResponseFileProcessingNotification {
  institutionCode: string;
  integrationContacts: string[];
  fileParsingErrors: number;
  totalRecords: number;
  totalDisbursements: number;
  disbursementsSuccessfullyProcessed: number;
  disbursementsSkipped: number;
  duplicateDisbursements: number;
  disbursementsFailedToProcess: number;
  attachmentFileContent: string;
}
