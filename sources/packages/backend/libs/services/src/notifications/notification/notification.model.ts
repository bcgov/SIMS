import { NotificationMessageType } from "@sims/sims-db";
import { NotificationEmailMessage } from "./gc-notify.model";
import { NotificationMetadata } from "@sims/sims-db/entities/notification-metadata.type";

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
  email: string;
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

export interface PartialStudentMatchNotification {
  givenNames: string;
  lastName: string;
  birthDate: Date;
  matchTime: Date;
  studentEmail: string;
  matches: string;
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

export interface DisbursementBlockedNotification {
  givenNames: string;
  lastName: string;
  email: string;
  birthDate: string;
  applicationNumber: string;
}

export interface ApplicationExceptionRequestNotification {
  givenNames: string;
  lastName: string;
  email: string;
  birthDate: string;
  applicationNumber: string;
}

export interface ApplicationEditedTooManyTimesNotification {
  givenNames: string;
  lastName: string;
  email: string;
  birthDate: string;
  applicationNumber: string;
}

export interface StudentSubmittedChangeRequestNotification {
  givenNames: string;
  lastName: string;
  email: string;
  birthDate: string;
  applicationNumber: string;
}

export interface StudentRequestsBasicBCeIDAccountNotification {
  givenNames: string;
  lastName: string;
  email: string;
  birthDate: string;
}

export interface ECertFeedbackFileErrorNotification {
  givenNames: string;
  lastName: string;
  applicationNumber: string;
  errorCodes: string[];
}

export interface ApplicationOfferingChangeRequestApprovedByStudentNotification {
  givenNames: string;
  lastName: string;
  email: string;
  birthDate: string;
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

export interface InstitutionRequestsDesignationNotification {
  institutionName: string;
  institutionOperatingName: string;
  institutionPrimaryEmail: string;
}

export interface InstitutionAddsPendingProgramNotification {
  institutionName: string;
  institutionOperatingName: string;
  programName: string;
  institutionPrimaryEmail: string;
}

export interface InstitutionAddsPendingOfferingNotification {
  institutionName: string;
  institutionOperatingName: string;
  institutionLocationName: string;
  programName: string;
  offeringName: string;
  institutionPrimaryEmail: string;
}

export interface DailyDisbursementReportProcessingNotification {
  attachmentFileContent: string;
  fileName: string;
}

export type NotificationSupportingUserType = "parents" | "partner" | "parent";

export interface SupportingUserInformationNotification {
  givenNames: string;
  lastName: string;
  toAddress: string;
  userId: number;
  supportingUserType: NotificationSupportingUserType;
}

export interface StudentPDPPDNotification {
  userId: number;
  givenNames: string;
  lastName: string;
  email: string;
  applicationNumber: string;
}
