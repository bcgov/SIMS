import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ColumnNames, TableNames } from "../constant";
import { NotificationMessage } from "./notification-message.model";
import { PermanentFailureError } from "./notification-permanent-failure-error.type";
import { NotificationMetadata } from "./notification-metadata.type";
import { RecordDataModel } from "./record.model";
import { User } from "./user.model";

@Entity({
  name: TableNames.Notifications,
})
export class Notification extends RecordDataModel {
  /**
   * Auto-generated sequential primary key column.
   */
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * User associated with this notification.
   */
  @ManyToOne(() => User, { eager: false, cascade: false, nullable: true })
  @JoinColumn({
    name: "user_id",
    referencedColumnName: ColumnNames.ID,
  })
  user?: User;
  /**
   * Message notification payload.
   */
  @Column({
    name: "message_payload",
    type: "jsonb",
    nullable: false,
  })
  messagePayload: unknown;
  /**
   * Message associated with this notification.
   */
  @ManyToOne(() => NotificationMessage, { eager: false, cascade: false })
  @JoinColumn({
    name: "notification_message_id",
    referencedColumnName: ColumnNames.ID,
  })
  notificationMessage: NotificationMessage;
  /**
   * Date Sent Column
   */
  @Column({
    name: "date_sent",
    type: "timestamptz",
    nullable: true,
  })
  dateSent?: Date;
  /**
   * Date Read Column
   */
  @Column({
    name: "date_read",
    type: "timestamptz",
    nullable: true,
  })
  dateRead?: Date;
  /**
   * Error details of a permanent failure if occurred while processing the notification.
   * A permanent failure indicates that a notification could not be delivered to
   * the recipient due to bad data and must not be retried.
   */
  @Column({
    name: "permanent_failure_error",
    type: "jsonb",
    nullable: true,
  })
  permanentFailureError: PermanentFailureError[];
  /**
   * Metadata information related to the saved notification.
   */
  @Column({
    name: "metadata",
    type: "jsonb",
    nullable: true,
  })
  metadata?: NotificationMetadata;
}

/**
 * Enumeration types for Notification Messages.
 */
export enum NotificationMessageType {
  /**
   * Student uploaded a file into his account.
   */
  StudentFileUpload = 1,
  /**
   * Ministry uploaded a file to the student account.
   */
  MinistryFileUpload = 2,
  /**
   * A new restriction was added to the student account.
   * Possible scenarios:
   * 1. Ministry places restriction on student account.
   * 2. System-generated restrictions on student account.
   * 3. Federal restriction placed on student account.
   */
  StudentRestrictionAdded = 3,
  /**
   * Ministry completes updating exception for an application.
   */
  MinistryCompletesException = 4,
  /**
   * Ministry completes updating a change requested by student.
   */
  MinistryCompletesChange = 5,
  /**
   * Institution reporting a change on application.
   */
  InstitutionReportsChange = 6,
  /**
   * Institution completes updating PIR.
   */
  InstitutionCompletesPIR = 7,
  /**
   * Institution completes enrolment for an application.
   */
  InstitutionCompletesCOE = 8,
  /**
   * Institution completes enrolment for an application.
   * (i.e NOA approval status required or not required)
   */
  AssessmentReadyForConfirmation = 9,
  /**
   * SIN Validation complete.
   */
  SINValidationComplete = 10,
  /**
   * ECE response file processing details.
   */
  ECEResponseFileProcessing = 11,
  /**
   * MSFAA record gets cancelled.
   */
  MSFAACancellation = 12,
  /**
   *  An Application Offering Change Request is in progress with the student.
   */
  ApplicationOfferingChangeRequestInProgressWithStudent = 13,
  /**
   * An Application Offering Change Request completed by ministry.
   */
  ApplicationOfferingChangeRequestCompletedByMinistry = 14,
  /**
   * A legacy restriction added to the student account.
   */
  LegacyRestrictionAdded = 15,
  /**
   * Student disbursement blocked.
   */
  StudentNotificationDisbursementBlocked = 16,
  /**
   * Ministry disbursement blocked.
   */
  MinistryNotificationDisbursementBlocked = 17,
  /**
   * Student submitted change request after COE.
   */
  StudentSubmittedChangeRequestNotification = 18,
  /**
   * Student submits application with exception request.
   */
  ApplicationExceptionRequestNotification = 19,
  /**
   * Student requests basic BCeID account.
   */
  StudentRequestsBasicBCeIDAccountNotification = 20,
  /**
   * Application edited for the 5th time.
   */
  ApplicationEditedTooManyTimesNotification = 21,
  /**
   * An Application Offering Change Request approved by the student.
   */
  ApplicationOfferingChangeRequestApprovedByStudentNotification = 22,
  /**
   * Institution adds pending program.
   */
  InstitutionAddsPendingProgramNotification = 23,
  /**
   * Institution adds pending offering.
   */
  InstitutionAddsPendingOfferingNotification = 24,
  /**
   * Institution Requests Designation.
   */
  InstitutionRequestsDesignationNotification = 25,
  /**
   * A partial match for a new student account was found.
   */
  PartialStudentMatchNotification = 26,
  /**
   * eCert Feedback File has errors.
   */
  ECertFeedbackFileErrorNotification = 27,
  /**
   * Ministry Provincial Daily Disbursement Receipt.
   */
  MinistryNotificationProvincialDailyDisbursementReceipt = 28,
  /**
   * Supporting User Information Notification.
   */
  SupportingUserInformationNotification = 29,
  /**
   * Student PD PPD Application Notification.
   */
  StudentPdPpdApplicationNotification = 30,
}
