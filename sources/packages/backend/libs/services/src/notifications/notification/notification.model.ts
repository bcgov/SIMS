import { NotificationMessageType } from "@sims/sims-db";
import { NotificationEmailMessage } from "./gc-notify.model";
import { NotificationMetadata } from "@sims/sims-db/entities/notification-metadata.type";
import { StringBuilder } from "@sims/utilities";

export interface SaveNotificationModel {
  userId?: number;
  messageType: NotificationMessageType;
  messagePayload: NotificationEmailMessage;
  metadata?: NotificationMetadata;
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

export interface DisbursementBlockedNotificationForMinistry {
  givenNames: string;
  lastName: string;
  email: string;
  dob: string;
  applicationNumber: string;
}

export interface ApplicationExceptionRequestNotificationForMinistry {
  givenNames: string;
  lastName: string;
  email: string;
  dob: string;
  applicationNumber: string;
}

export interface ApplicationEditedFifthTimeNotificationForMinistry {
  givenNames: string;
  lastName: string;
  email: string;
  dob: string;
  applicationNumber: string;
}

export interface StudentSubmittedChangeRequestNotificationForMinistry {
  givenNames: string;
  lastName: string;
  email: string;
  dob: string;
  applicationNumber: string;
}

export interface StudentRequestsBasicBCeIDAccountNotificationForMinistry {
  givenNames: string;
  lastName: string;
  email: string;
  dob: string;
}

export interface ApplicationOfferingChangeRequestApprovedByStudentNotificationForMinistry {
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

export interface InstitutionRequestsDesignationNotificationForMinistry {
  institutionName: string;
  institutionOperatingName: string;
  institutionPrimaryEmail: string;
}

export interface InstitutionAddsPendingProgramNotificationForMinistry {
  institutionName: string;
  institutionOperatingName: string;
  programName: string;
  institutionPrimaryEmail: string;
}

export interface InstitutionAddsPendingOfferingNotificationForMinistry {
  institutionName: string;
  institutionOperatingName: string;
  institutionLocationName: string;
  programName: string;
  offeringName: string;
  institutionPrimaryEmail: string;
}
