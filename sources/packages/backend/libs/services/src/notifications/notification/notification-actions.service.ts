import { Injectable } from "@nestjs/common";
import { NotificationMessage, NotificationMessageType } from "@sims/sims-db";
import {
  base64Encode,
  getDateOnlyFormat,
  getPSTPDTDateTime,
} from "@sims/utilities";
import { EntityManager } from "typeorm";
import { NotificationMessageService } from "../notification-message/notification-message.service";
import {
  StudentRestrictionAddedNotification,
  MinistryStudentFileUploadNotification,
  MSFAACancellationNotification,
  StudentFileUploadNotification,
  StudentNotification,
  ECEResponseFileProcessingNotification,
  NotificationEmailMessage,
  ApplicationOfferingChangeRequestInProgressWithStudentNotification,
  ApplicationOfferingChangeRequestCompleteNotification,
  LegacyRestrictionAddedNotification,
  DisbursementBlockedNotification,
  ApplicationExceptionRequestNotification,
  ApplicationEditedTooManyTimesNotification,
  StudentSubmittedChangeRequestNotification,
  InstitutionRequestsDesignationNotification,
  StudentRequestsBasicBCeIDAccountNotification,
  InstitutionAddsPendingOfferingNotification,
  InstitutionAddsPendingProgramNotification,
  ApplicationOfferingChangeRequestApprovedByStudentNotification,
  PartialStudentMatchNotification,
  ECertFeedbackFileErrorNotification,
  DailyDisbursementReportProcessingNotification,
  SupportingUserInformationNotification,
  StudentPDPPDNotification,
  StudentSecondDisbursementNotification,
  ParentInformationRequiredFromParentNotification,
  ParentInformationRequiredFromStudentNotification,
} from "..";
import { NotificationService } from "./notification.service";
import { InjectLogger, LoggerService } from "@sims/utilities/logger";
import { ECE_RESPONSE_ATTACHMENT_FILE_NAME } from "@sims/integrations/constants";
import { SystemUsersService } from "@sims/services/system-users";
import { NotificationMetadata } from "@sims/sims-db/entities/notification-metadata.type";

@Injectable()
export class NotificationActionsService {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly notificationMessageService: NotificationMessageService,
    private readonly systemUsersService: SystemUsersService,
  ) {}

  /**
   * Creates a notification when a student uploads documents
   * and submits it in the file uploader screen.
   * @param notification input parameters to generate the notification.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @param entityManager optional repository that can be provided, for instance,
   * to execute the command as part of an existing transaction. If not provided
   * the local repository will be used instead.
   */
  async saveFileUploadNotification(
    notification: StudentFileUploadNotification,
    auditUserId: number,
    entityManager?: EntityManager,
  ): Promise<void> {
    const { templateId, emailContacts } =
      await this.assertNotificationMessageDetails(
        NotificationMessageType.StudentFileUpload,
      );
    if (!emailContacts?.length) {
      return;
    }
    const ministryNotificationsToSend = emailContacts.map((emailContact) => ({
      userId: notification.userId,
      messageType: NotificationMessageType.StudentFileUpload,
      messagePayload: {
        email_address: emailContact,
        template_id: templateId,
        personalisation: {
          givenNames: notification.firstName ?? "",
          lastName: notification.lastName,
          birthDate: getDateOnlyFormat(notification.birthDate),
          applicationNumber: notification.applicationNumber,
          studentEmail: notification.email,
          documentPurpose: notification.documentPurpose,
          dateTime: this.getDateTimeOnPSTTimeZone(),
          fileNames: notification.fileNames,
        },
      },
    }));

    // Save notification into notification table.
    await this.notificationService.saveNotifications(
      ministryNotificationsToSend,
      auditUserId,
      { entityManager },
    );
  }

  /**
   * Creates a notification when the Ministry uploads a file to student account.
   * @param notification input parameters to generate the notification.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @param entityManager optional repository that can be provided, for instance,
   * to execute the command as part of an existing transaction. If not provided
   * the local repository will be used instead.
   */
  async saveMinistryFileUploadNotification(
    notification: MinistryStudentFileUploadNotification,
    auditUserId: number,
    entityManager?: EntityManager,
  ): Promise<void> {
    const { templateId } =
      await this.notificationMessageService.getNotificationMessageDetails(
        NotificationMessageType.MinistryFileUpload,
      );

    const notificationToSend = {
      userId: notification.userId,
      messageType: NotificationMessageType.MinistryFileUpload,
      messagePayload: {
        email_address: notification.toAddress,
        template_id: templateId,
        personalisation: {
          givenNames: notification.firstName ?? "",
          lastName: notification.lastName,
          date: this.getDateTimeOnPSTTimeZone(),
        },
      },
    };

    // Save notification into notification table.
    await this.notificationService.saveNotifications(
      [notificationToSend],
      auditUserId,
      { entityManager },
    );
  }

  /**
   * Creates a notification when there is a partial match for a student account.
   * @param notification input parameters to generate the notification.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @param entityManager optional repository that can be provided, for instance,
   * to execute the command as part of an existing transaction. If not provided
   * the local repository will be used instead.
   */
  async savePartialStudentMatchNotification(
    notification: PartialStudentMatchNotification,
    auditUserId: number,
    entityManager?: EntityManager,
  ): Promise<void> {
    const { templateId, emailContacts } =
      await this.assertNotificationMessageDetails(
        NotificationMessageType.PartialStudentMatchNotification,
      );
    if (!emailContacts?.length) {
      return;
    }

    const ministryNotificationsToSend = emailContacts.map((emailContact) => ({
      messageType: NotificationMessageType.PartialStudentMatchNotification,
      messagePayload: {
        template_id: templateId,
        email_address: emailContact,
        personalisation: {
          givenNames: notification.givenNames ?? "",
          lastName: notification.lastName,
          birthDate: getDateOnlyFormat(notification.birthDate),
          matchTime: this.getDateTimeOnPSTTimeZone(),
          studentEmail: notification.studentEmail,
          matches: notification.matches,
        },
      },
    }));

    // Save notification into notification table.
    await this.notificationService.saveNotifications(
      ministryNotificationsToSend,
      auditUserId,
      { entityManager },
    );
  }

  /**
   * Creates a notification when an MSFAA record gets cancelled.
   * @param notification input parameters to generate the notification.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @param entityManager optional entity manager to execute in transaction.
   */
  async saveMSFAACancellationNotification(
    notification: MSFAACancellationNotification,
    auditUserId: number,
    entityManager?: EntityManager,
  ): Promise<void> {
    const { templateId } =
      await this.notificationMessageService.getNotificationMessageDetails(
        NotificationMessageType.MSFAACancellation,
      );

    const messagePayload: NotificationEmailMessage = {
      email_address: notification.toAddress,
      template_id: templateId,
      personalisation: {
        givenNames: notification.givenNames ?? "",
        lastName: notification.lastName,
      },
    };

    const notificationToSend = {
      userId: notification.userId,
      messageType: NotificationMessageType.MSFAACancellation,
      messagePayload: messagePayload,
    };

    // Save notification into notification table.
    await this.notificationService.saveNotifications(
      [notificationToSend],
      auditUserId,
      { entityManager },
    );
  }

  /**
   * Creates a notification when an Offering Change Request is inprogress with the student.
   * @param notification input parameters to generate the notification.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @param entityManager optional entity manager to execute in transaction.
   */
  async saveApplicationOfferingChangeRequestInProgressWithStudentNotification(
    notification: ApplicationOfferingChangeRequestInProgressWithStudentNotification,
    auditUserId: number,
    entityManager?: EntityManager,
  ): Promise<void> {
    const { templateId } =
      await this.notificationMessageService.getNotificationMessageDetails(
        NotificationMessageType.ApplicationOfferingChangeRequestInProgressWithStudent,
      );
    const messagePayload: NotificationEmailMessage = {
      email_address: notification.toAddress,
      template_id: templateId,
      personalisation: {
        givenNames: notification.givenNames ?? "",
        lastName: notification.lastName,
      },
    };
    const notificationToSend = {
      userId: notification.userId,
      messageType:
        NotificationMessageType.ApplicationOfferingChangeRequestInProgressWithStudent,
      messagePayload: messagePayload,
    };
    // Save notification into notification table.
    await this.notificationService.saveNotifications(
      [notificationToSend],
      auditUserId,
      { entityManager },
    );
  }

  /**
   * Creates a notification when an Application Offering Change Request is completed by the ministry.
   * @param notification input parameters to generate the notification.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @param entityManager optional entity manager to execute in transaction.
   */
  async saveApplicationOfferingChangeRequestCompleteNotification(
    notification: ApplicationOfferingChangeRequestCompleteNotification,
    auditUserId: number,
    entityManager: EntityManager,
  ): Promise<void> {
    const { templateId } =
      await this.notificationMessageService.getNotificationMessageDetails(
        NotificationMessageType.ApplicationOfferingChangeRequestCompletedByMinistry,
      );
    const messagePayload: NotificationEmailMessage = {
      email_address: notification.toAddress,
      template_id: templateId,
      personalisation: {
        givenNames: notification.givenNames ?? "",
        lastName: notification.lastName,
      },
    };
    const notificationToSend = {
      userId: notification.userId,
      messageType:
        NotificationMessageType.ApplicationOfferingChangeRequestCompletedByMinistry,
      messagePayload: messagePayload,
    };
    // Save notification into notification table.
    await this.notificationService.saveNotifications(
      [notificationToSend],
      auditUserId,
      { entityManager },
    );
  }

  /**
   * Creates a new notification when a new restriction is added to the student account.
   * @param notifications notifications information.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @param entityManager entity manager to execute in transaction.
   */
  async saveStudentRestrictionAddedNotification(
    notifications: StudentRestrictionAddedNotification[],
    auditUserId: number,
    entityManager?: EntityManager,
  ): Promise<void> {
    const { templateId } =
      await this.notificationMessageService.getNotificationMessageDetails(
        NotificationMessageType.StudentRestrictionAdded,
      );
    const notificationsToSend = notifications.map((notification) => ({
      userId: notification.userId,
      messageType: NotificationMessageType.StudentRestrictionAdded,
      messagePayload: {
        email_address: notification.toAddress,
        template_id: templateId,
        personalisation: {
          givenNames: notification.givenNames ?? "",
          lastName: notification.lastName,
          date: this.getDateTimeOnPSTTimeZone(),
        },
      },
    }));

    // Save notification into notification table.
    await this.notificationService.saveNotifications(
      notificationsToSend,
      auditUserId,
      { entityManager },
    );
  }

  /**
   * Creates a new ministry notification for each student when a legacy restriction is added to their account.
   * @param notifications notifications information.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @param entityManager entity manager to execute in transaction.
   */
  async saveLegacyRestrictionAddedNotification(
    notifications: LegacyRestrictionAddedNotification[],
    auditUserId: number,
    entityManager?: EntityManager,
  ): Promise<void> {
    const { templateId, emailContacts } =
      await this.assertNotificationMessageDetails(
        NotificationMessageType.LegacyRestrictionAdded,
      );
    if (!emailContacts?.length) {
      return;
    }
    const ministryNotificationsToSend = [];
    emailContacts.forEach((emailContact) => {
      const notificationsToSend = notifications.map((notification) => ({
        userId: notification.userId,
        messageType: NotificationMessageType.LegacyRestrictionAdded,
        messagePayload: {
          email_address: emailContact,
          template_id: templateId,
          personalisation: {
            givenNames: notification.firstName ?? "",
            lastName: notification.lastName,
            studentEmail: notification.email,
            birthDate: getDateOnlyFormat(notification.birthDate),
            dateTime: this.getDateTimeOnPSTTimeZone(),
          },
        },
      }));
      ministryNotificationsToSend.push(...notificationsToSend);
    });
    // Save notification into notification table.
    await this.notificationService.saveNotifications(
      ministryNotificationsToSend,
      auditUserId,
      { entityManager },
    );
  }

  /**
   * Create exception complete notification to notify
   * student when an application exception is completed by ministry.
   * @param notification notification details.
   * @param auditUserId user who completes the exception.
   * @param entityManager entity manager to execute in transaction.
   */
  async saveExceptionCompleteNotification(
    notification: StudentNotification,
    auditUserId: number,
    entityManager: EntityManager,
  ): Promise<void> {
    const { templateId } =
      await this.notificationMessageService.getNotificationMessageDetails(
        NotificationMessageType.MinistryCompletesException,
      );

    const exceptionCompleteNotification = {
      userId: notification.userId,
      messageType: NotificationMessageType.MinistryCompletesException,
      messagePayload: {
        email_address: notification.toAddress,
        template_id: templateId,
        personalisation: {
          givenNames: notification.givenNames ?? "",
          lastName: notification.lastName,
          date: this.getDateTimeOnPSTTimeZone(),
        },
      },
    };

    await this.notificationService.saveNotifications(
      [exceptionCompleteNotification],
      auditUserId,
      { entityManager },
    );
  }

  /**
   * Create change request complete notification to notify student
   * when a change request is completed by ministry.
   * @param notification notification details.
   * @param auditUserId user who completes the change request.
   * @param entityManager entity manager to execute in transaction.
   */
  async saveChangeRequestCompleteNotification(
    notification: StudentNotification,
    auditUserId: number,
    entityManager: EntityManager,
  ): Promise<void> {
    const { templateId } =
      await this.notificationMessageService.getNotificationMessageDetails(
        NotificationMessageType.MinistryCompletesChange,
      );

    const changeRequestCompleteNotification = {
      userId: notification.userId,
      messageType: NotificationMessageType.MinistryCompletesChange,
      messagePayload: {
        email_address: notification.toAddress,
        template_id: templateId,
        personalisation: {
          givenNames: notification.givenNames ?? "",
          lastName: notification.lastName,
          date: this.getDateTimeOnPSTTimeZone(),
        },
      },
    };

    await this.notificationService.saveNotifications(
      [changeRequestCompleteNotification],
      auditUserId,
      { entityManager },
    );
  }

  /**
   * Create institution report change notification to notify student
   * when institution reports a change to their application.
   * @param notification notification details.
   * @param auditUserId user who reports the change.
   * @param entityManager entity manager to execute in transaction.
   */
  async saveInstitutionReportChangeNotification(
    notification: StudentNotification,
    auditUserId: number,
    entityManager: EntityManager,
  ): Promise<void> {
    const { templateId } =
      await this.notificationMessageService.getNotificationMessageDetails(
        NotificationMessageType.InstitutionReportsChange,
      );

    const institutionReportChangeNotification = {
      userId: notification.userId,
      messageType: NotificationMessageType.InstitutionReportsChange,
      messagePayload: {
        email_address: notification.toAddress,
        template_id: templateId,
        personalisation: {
          givenNames: notification.givenNames ?? "",
          lastName: notification.lastName,
          date: this.getDateTimeOnPSTTimeZone(),
        },
      },
    };

    await this.notificationService.saveNotifications(
      [institutionReportChangeNotification],
      auditUserId,
      { entityManager },
    );
  }

  /**
   * Create institution complete PIR notification to notify student
   * when institution completes PIR to their application.
   * @param notification notification details.
   * @param auditUserId user who completes PIR.
   * @param entityManager entity manager to execute in transaction.
   */
  async saveInstitutionCompletePIRNotification(
    notification: StudentNotification,
    auditUserId: number,
    entityManager: EntityManager,
  ): Promise<void> {
    const { templateId } =
      await this.notificationMessageService.getNotificationMessageDetails(
        NotificationMessageType.InstitutionCompletesPIR,
      );

    const institutionCompletePIRNotification = {
      userId: notification.userId,
      messageType: NotificationMessageType.InstitutionCompletesPIR,
      messagePayload: {
        email_address: notification.toAddress,
        template_id: templateId,
        personalisation: {
          givenNames: notification.givenNames ?? "",
          lastName: notification.lastName,
          date: this.getDateTimeOnPSTTimeZone(),
        },
      },
    };

    await this.notificationService.saveNotifications(
      [institutionCompletePIRNotification],
      auditUserId,
      { entityManager },
    );
  }

  /**
   * Create institution confirm COE notification to notify student
   * when institution confirms a COE to their application.
   * @param notification notification details.
   * @param auditUserId user who confirms COE.
   * @param entityManager entity manager to execute in transaction.
   */
  async saveInstitutionCompletesCOENotification(
    notification: StudentNotification,
    auditUserId: number,
    entityManager: EntityManager,
  ): Promise<void> {
    const { templateId } =
      await this.notificationMessageService.getNotificationMessageDetails(
        NotificationMessageType.InstitutionCompletesCOE,
      );

    const institutionConfirmCOENotification = {
      userId: notification.userId,
      messageType: NotificationMessageType.InstitutionCompletesCOE,
      messagePayload: {
        email_address: notification.toAddress,
        template_id: templateId,
        personalisation: {
          givenNames: notification.givenNames ?? "",
          lastName: notification.lastName,
          date: this.getDateTimeOnPSTTimeZone(),
        },
      },
    };

    await this.notificationService.saveNotifications(
      [institutionConfirmCOENotification],
      auditUserId,
      { entityManager },
    );
  }

  /**
   * Get the date and time converted to BC time-zone (PST) format
   * to be displayed in the messages.
   * @param date date to be formatted.
   * @returns Date and time as it should be displayed in the messages.
   */
  private getDateTimeOnPSTTimeZone(date = new Date()): string {
    return `${getPSTPDTDateTime(date)} PST/PDT`;
  }

  /**
   * Create assessment ready for student confirmation notification to notify student
   * when workflow update the NOA approval status.
   * @param notification notification details.
   * @param auditUserId user who updates NOA approval status.
   * @param entityManager entity manager to execute in transaction.
   */
  async saveAssessmentReadyForConfirmationNotification(
    notification: StudentNotification,
    auditUserId: number,
    entityManager: EntityManager,
  ): Promise<void> {
    const { templateId } =
      await this.notificationMessageService.getNotificationMessageDetails(
        NotificationMessageType.AssessmentReadyForConfirmation,
        { entityManager },
      );
    const assessmentReadyNotification = {
      userId: notification.userId,
      messageType: NotificationMessageType.AssessmentReadyForConfirmation,
      messagePayload: {
        email_address: notification.toAddress,
        template_id: templateId,
        personalisation: {
          givenNames: notification.givenNames ?? "",
          lastName: notification.lastName,
          date: this.getDateTimeOnPSTTimeZone(),
        },
      },
    };
    await this.notificationService.saveNotifications(
      [assessmentReadyNotification],
      auditUserId,
      { entityManager },
    );
  }

  /**
   * Create SIN Validation complete notification for student.
   * @param notification notification details.
   * @param auditUserId user who updates SIN validation status.
   * @param entityManager entity manager to execute in transaction.
   */
  async saveSINCompleteNotification(
    notification: StudentNotification,
    auditUserId: number,
    entityManager: EntityManager,
  ): Promise<void> {
    const { templateId } =
      await this.notificationMessageService.getNotificationMessageDetails(
        NotificationMessageType.SINValidationComplete,
      );
    const sinCompleteNotification = {
      userId: notification.userId,
      messageType: NotificationMessageType.SINValidationComplete,
      messagePayload: {
        email_address: notification.toAddress,
        template_id: templateId,
        personalisation: {
          givenNames: notification.givenNames ?? "",
          lastName: notification.lastName,
          date: this.getDateTimeOnPSTTimeZone(),
        },
      },
    };
    await this.notificationService.saveNotifications(
      [sinCompleteNotification],
      auditUserId,
      { entityManager },
    );
  }

  /**
   * Create ECE Response file processing notifications.
   * Currently multiple notifications are created as integration contacts
   * can be multiple.
   * TODO: Use email bulk send in GC Notify when bulk send email is available.
   * @param notification notification.
   */
  async saveECEResponseFileProcessingNotification(
    notification: ECEResponseFileProcessingNotification,
  ): Promise<void> {
    const auditUser = this.systemUsersService.systemUser;
    const { templateId } =
      await this.notificationMessageService.getNotificationMessageDetails(
        NotificationMessageType.ECEResponseFileProcessing,
      );
    const eceResponseFileProcessingNotifications = [];

    for (const integrationContact of notification.integrationContacts) {
      const messagePayload: NotificationEmailMessage = {
        email_address: integrationContact,
        template_id: templateId,
        personalisation: {
          date: this.getDateTimeOnPSTTimeZone(),
          institutionCode: notification.institutionCode,
          fileParsingErrors: notification.fileParsingErrors,
          totalRecords: notification.totalRecords,
          totalDisbursements: notification.totalDisbursements,
          disbursementsSuccessfullyProcessed:
            notification.disbursementsSuccessfullyProcessed,
          disbursementsSkipped: notification.disbursementsSkipped,
          duplicateDisbursements: notification.duplicateDisbursements,
          disbursementsFailedToProcess:
            notification.disbursementsFailedToProcess,
          application_file: {
            file: base64Encode(notification.attachmentFileContent),
            filename: ECE_RESPONSE_ATTACHMENT_FILE_NAME,
            sending_method: "attach",
          },
        },
      };
      const eceResponseFileProcessingNotification = {
        messageType: NotificationMessageType.ECEResponseFileProcessing,
        messagePayload: messagePayload,
      };
      eceResponseFileProcessingNotifications.push(
        eceResponseFileProcessingNotification,
      );
    }
    await this.notificationService.saveNotifications(
      eceResponseFileProcessingNotifications,
      auditUser.id,
    );
  }

  /**
   * Creates blocked disbursement notification for student.
   * @param notification notification details.
   * @param disbursementId disbursement id.
   * @param entityManager entity manager to execute in transaction.
   */
  async saveDisbursementBlockedNotificationForStudent(
    notification: StudentNotification,
    disbursementId: number,
    entityManager: EntityManager,
  ): Promise<void> {
    const auditUser = this.systemUsersService.systemUser;
    const { templateId } =
      await this.notificationMessageService.getNotificationMessageDetails(
        NotificationMessageType.StudentNotificationDisbursementBlocked,
      );
    const notificationToSend = {
      userId: notification.userId,
      messageType:
        NotificationMessageType.StudentNotificationDisbursementBlocked,
      messagePayload: {
        email_address: notification.toAddress,
        template_id: templateId,
        personalisation: {
          givenNames: notification.givenNames ?? "",
          lastName: notification.lastName,
        },
      },
      metadata: { disbursementId },
    };
    // Save notification to be sent to the student into the notification table.
    await this.notificationService.saveNotifications(
      [notificationToSend],
      auditUser.id,
      { entityManager },
    );
  }

  /**
   * Creates blocked disbursement notification for ministry.
   * @param notification notification details.
   * @param disbursementId disbursement id.
   * @param entityManager entity manager to execute in transaction.
   */
  async saveDisbursementBlockedNotificationForMinistry(
    notification: DisbursementBlockedNotification,
    disbursementId: number,
    entityManager: EntityManager,
  ): Promise<void> {
    const auditUser = this.systemUsersService.systemUser;
    const { templateId, emailContacts } =
      await this.assertNotificationMessageDetails(
        NotificationMessageType.MinistryNotificationDisbursementBlocked,
      );
    if (!emailContacts?.length) {
      return;
    }
    const ministryNotificationsToSend = emailContacts.map((emailContact) => ({
      userId: auditUser.id,
      messageType:
        NotificationMessageType.MinistryNotificationDisbursementBlocked,
      messagePayload: {
        email_address: emailContact,
        template_id: templateId,
        personalisation: {
          givenNames: notification.givenNames ?? "",
          lastName: notification.lastName,
          birthDate: getDateOnlyFormat(notification.birthDate),
          studentEmail: notification.email,
          applicationNumber: notification.applicationNumber,
          dateTime: this.getDateTimeOnPSTTimeZone(),
        },
      },
      metadata: { disbursementId },
    }));
    // Save notifications to be sent to the ministry into the notification table.
    await this.notificationService.saveNotifications(
      ministryNotificationsToSend,
      auditUser.id,
      { entityManager },
    );
  }

  /**
   * Creates application exception request notification for ministry.
   * @param notification notification details.
   * @param entityManager entity manager to execute in transaction.
   */
  async saveApplicationExceptionRequestNotification(
    notification: ApplicationExceptionRequestNotification,
    entityManager: EntityManager,
  ): Promise<void> {
    const auditUser = this.systemUsersService.systemUser;
    const { templateId, emailContacts } =
      await this.assertNotificationMessageDetails(
        NotificationMessageType.ApplicationExceptionRequestNotification,
      );
    if (!emailContacts?.length) {
      return;
    }
    const ministryNotificationsToSend = emailContacts.map((emailContact) => ({
      userId: auditUser.id,
      messageType:
        NotificationMessageType.ApplicationExceptionRequestNotification,
      messagePayload: {
        email_address: emailContact,
        template_id: templateId,
        personalisation: {
          givenNames: notification.givenNames ?? "",
          lastName: notification.lastName,
          birthDate: getDateOnlyFormat(notification.birthDate),
          studentEmail: notification.email,
          applicationNumber: notification.applicationNumber,
          dateTime: this.getDateTimeOnPSTTimeZone(),
        },
      },
    }));
    // Save notifications to be sent to the ministry into the notification table.
    await this.notificationService.saveNotifications(
      ministryNotificationsToSend,
      auditUser.id,
      { entityManager },
    );
  }

  /**
   * Creates application edited too many times notification for the ministry.
   * @param notification notification details.
   * @param applicationNumber related application number.
   * @param entityManager entity manager to execute in transaction.
   */
  async saveApplicationEditedTooManyTimesNotification(
    notification: ApplicationEditedTooManyTimesNotification,
    applicationNumber: string,
    entityManager: EntityManager,
  ): Promise<void> {
    const auditUser = this.systemUsersService.systemUser;
    const { templateId, emailContacts } =
      await this.assertNotificationMessageDetails(
        NotificationMessageType.ApplicationEditedTooManyTimesNotification,
      );
    if (!emailContacts?.length) {
      return;
    }
    const ministryNotificationsToSend = emailContacts.map((emailContact) => ({
      userId: auditUser.id,
      messageType:
        NotificationMessageType.ApplicationEditedTooManyTimesNotification,
      messagePayload: {
        email_address: emailContact,
        template_id: templateId,
        personalisation: {
          givenNames: notification.givenNames ?? "",
          lastName: notification.lastName,
          birthDate: getDateOnlyFormat(notification.birthDate),
          studentEmail: notification.email,
          applicationNumber: notification.applicationNumber,
          dateTime: this.getDateTimeOnPSTTimeZone(),
        },
      },
      metadata: { applicationNumber },
    }));
    // Save notifications to be sent to the ministry into the notification table.
    await this.notificationService.saveNotifications(
      ministryNotificationsToSend,
      auditUser.id,
      { entityManager },
    );
  }

  /**
   * Creates student submitted change request after COE notification for ministry.
   * @param notification notification details.
   * @param entityManager entity manager to execute in transaction.
   */
  async saveStudentSubmittedChangeRequestNotification(
    notification: StudentSubmittedChangeRequestNotification,
    entityManager: EntityManager,
  ): Promise<void> {
    const auditUser = this.systemUsersService.systemUser;
    const { templateId, emailContacts } =
      await this.assertNotificationMessageDetails(
        NotificationMessageType.StudentSubmittedChangeRequestNotification,
      );
    if (!emailContacts?.length) {
      return;
    }
    const ministryNotificationsToSend = emailContacts.map((emailContact) => ({
      userId: auditUser.id,
      messageType:
        NotificationMessageType.StudentSubmittedChangeRequestNotification,
      messagePayload: {
        email_address: emailContact,
        template_id: templateId,
        personalisation: {
          givenNames: notification.givenNames ?? "",
          lastName: notification.lastName,
          birthDate: getDateOnlyFormat(notification.birthDate),
          studentEmail: notification.email,
          applicationNumber: notification.applicationNumber,
          dateTime: this.getDateTimeOnPSTTimeZone(),
        },
      },
    }));
    // Save notifications to be sent to the ministry into the notification table.
    await this.notificationService.saveNotifications(
      ministryNotificationsToSend,
      auditUser.id,
      { entityManager },
    );
  }

  /**
   * Creates student requests basic bceid account notification for ministry.
   * @param notification notification details.
   * @param entityManager entity manager to execute in transaction.
   */
  async saveStudentRequestsBasicBCeIDAccountNotification(
    notification: StudentRequestsBasicBCeIDAccountNotification,
    entityManager: EntityManager,
  ): Promise<void> {
    const auditUser = this.systemUsersService.systemUser;
    const { templateId, emailContacts } =
      await this.assertNotificationMessageDetails(
        NotificationMessageType.StudentRequestsBasicBCeIDAccountNotification,
      );
    if (!emailContacts?.length) {
      return;
    }
    const ministryNotificationsToSend = emailContacts.map((emailContact) => ({
      userId: auditUser.id,
      messageType:
        NotificationMessageType.StudentRequestsBasicBCeIDAccountNotification,
      messagePayload: {
        email_address: emailContact,
        template_id: templateId,
        personalisation: {
          givenNames: notification.givenNames ?? "",
          lastName: notification.lastName,
          birthDate: getDateOnlyFormat(notification.birthDate),
          studentEmail: notification.email,
          dateTime: this.getDateTimeOnPSTTimeZone(),
        },
      },
    }));
    // Save notifications to be sent to the ministry into the notification table.
    await this.notificationService.saveNotifications(
      ministryNotificationsToSend,
      auditUser.id,
      { entityManager },
    );
  }

  /**
   * Creates application offering change request approved by student notification for ministry.
   * @param notification notification details.
   * @param entityManager entity manager to execute in transaction.
   */
  async saveApplicationOfferingChangeApprovedByStudent(
    notification: ApplicationOfferingChangeRequestApprovedByStudentNotification,
    entityManager: EntityManager,
  ): Promise<void> {
    const auditUser = this.systemUsersService.systemUser;
    const { templateId, emailContacts } =
      await this.assertNotificationMessageDetails(
        NotificationMessageType.ApplicationOfferingChangeRequestApprovedByStudentNotification,
      );
    if (!emailContacts?.length) {
      return;
    }
    const ministryNotificationsToSend = emailContacts.map((emailContact) => ({
      userId: auditUser.id,
      messageType:
        NotificationMessageType.ApplicationOfferingChangeRequestApprovedByStudentNotification,
      messagePayload: {
        email_address: emailContact,
        template_id: templateId,
        personalisation: {
          givenNames: notification.givenNames ?? "",
          lastName: notification.lastName,
          birthDate: getDateOnlyFormat(notification.birthDate),
          studentEmail: notification.email,
          applicationNumber: notification.applicationNumber,
          dateTime: this.getDateTimeOnPSTTimeZone(),
        },
      },
    }));
    // Save notifications to be sent to the ministry into the notification table.
    await this.notificationService.saveNotifications(
      ministryNotificationsToSend,
      auditUser.id,
      { entityManager },
    );
  }

  /**
   * Creates institution requests designation notification for ministry.
   * @param notification notification details.
   * @param entityManager entity manager to execute in transaction.
   */
  async saveInstitutionRequestsDesignationNotification(
    notification: InstitutionRequestsDesignationNotification,
    entityManager: EntityManager,
  ): Promise<void> {
    const auditUser = this.systemUsersService.systemUser;
    const { templateId, emailContacts } =
      await this.assertNotificationMessageDetails(
        NotificationMessageType.InstitutionRequestsDesignationNotification,
      );
    if (!emailContacts?.length) {
      return;
    }
    const ministryNotificationsToSend = emailContacts.map((emailContact) => ({
      userId: auditUser.id,
      messageType:
        NotificationMessageType.InstitutionRequestsDesignationNotification,
      messagePayload: {
        email_address: emailContact,
        template_id: templateId,
        personalisation: {
          institutionName: notification.institutionName,
          institutionOperatingName: notification.institutionOperatingName,
          institutionPrimaryEmail: notification.institutionPrimaryEmail,
          dateTime: this.getDateTimeOnPSTTimeZone(),
        },
      },
    }));
    // Save notifications to be sent to the ministry into the notification table.
    await this.notificationService.saveNotifications(
      ministryNotificationsToSend,
      auditUser.id,
      { entityManager },
    );
  }

  /**
   * Creates institution adds pending program notification for ministry.
   * @param notification notification details.
   * @param entityManager entity manager to execute in transaction.
   */
  async saveInstitutionAddsPendingProgramNotification(
    notification: InstitutionAddsPendingProgramNotification,
    entityManager: EntityManager,
  ): Promise<void> {
    const auditUser = this.systemUsersService.systemUser;
    const { templateId, emailContacts } =
      await this.assertNotificationMessageDetails(
        NotificationMessageType.InstitutionAddsPendingProgramNotification,
      );
    if (!emailContacts?.length) {
      return;
    }
    const ministryNotificationsToSend = emailContacts.map((emailContact) => ({
      userId: auditUser.id,
      messageType:
        NotificationMessageType.InstitutionAddsPendingProgramNotification,
      messagePayload: {
        email_address: emailContact,
        template_id: templateId,
        personalisation: {
          institutionName: notification.institutionName,
          institutionOperatingName: notification.institutionOperatingName,
          institutionPrimaryEmail: notification.institutionPrimaryEmail,
          programName: notification.programName,
          dateTime: this.getDateTimeOnPSTTimeZone(),
        },
      },
    }));
    // Save notifications to be sent to the ministry into the notification table.
    await this.notificationService.saveNotifications(
      ministryNotificationsToSend,
      auditUser.id,
      { entityManager },
    );
  }

  /**
   * Creates institution adds pending offering notification for ministry.
   * @param notification notification details.
   * @param entityManager entity manager to execute in transaction.
   */
  async saveInstitutionAddsPendingOfferingNotification(
    notification: InstitutionAddsPendingOfferingNotification,
    entityManager: EntityManager,
  ): Promise<void> {
    const auditUser = this.systemUsersService.systemUser;
    const { templateId, emailContacts } =
      await this.assertNotificationMessageDetails(
        NotificationMessageType.InstitutionAddsPendingOfferingNotification,
      );
    if (!emailContacts?.length) {
      return;
    }
    const ministryNotificationsToSend = emailContacts.map((emailContact) => ({
      userId: auditUser.id,
      messageType:
        NotificationMessageType.InstitutionAddsPendingOfferingNotification,
      messagePayload: {
        email_address: emailContact,
        template_id: templateId,
        personalisation: {
          institutionName: notification.institutionName,
          institutionOperatingName: notification.institutionOperatingName,
          institutionLocationName: notification.institutionLocationName,
          programName: notification.programName,
          offeringName: notification.offeringName,
          institutionPrimaryEmail: notification.institutionPrimaryEmail,
          dateTime: this.getDateTimeOnPSTTimeZone(),
        },
      },
    }));
    // Save notifications to be sent to the ministry into the notification table.
    await this.notificationService.saveNotifications(
      ministryNotificationsToSend,
      auditUser.id,
      { entityManager },
    );
  }

  /**
   * Saves eCert Feedback File Error notification for ministry.
   * @param notification notification details.
   * @param metadata metadata related to the notification to be saved.
   * @param entityManager entity manager to execute in transaction.
   */
  async saveECertFeedbackFileErrorNotification(
    notification: ECertFeedbackFileErrorNotification,
    metadata: NotificationMetadata,
    entityManager: EntityManager,
  ): Promise<void> {
    const auditUser = this.systemUsersService.systemUser;
    const { templateId, emailContacts } =
      await this.assertNotificationMessageDetails(
        NotificationMessageType.ECertFeedbackFileErrorNotification,
      );
    if (!emailContacts?.length) {
      return;
    }
    const ministryNotificationsToSend = emailContacts.map((emailContact) => ({
      messageType: NotificationMessageType.ECertFeedbackFileErrorNotification,
      messagePayload: {
        email_address: emailContact,
        template_id: templateId,
        personalisation: {
          givenNames: notification.givenNames ?? "",
          lastName: notification.lastName,
          applicationNumber: notification.applicationNumber,
          errorCodes: notification.errorCodes,
        },
      },
      metadata,
    }));
    // Save notifications to be sent to the ministry into the notification table.
    await this.notificationService.saveNotifications(
      ministryNotificationsToSend,
      auditUser.id,
      { entityManager },
    );
  }

  /**
   * Creates Provincial Daily Disbursement Report file processing notifications.
   * Currently multiple notifications are created as integration contacts
   * can be multiple.
   * @param notification notification details.
   */
  async saveProvincialDailyDisbursementReportProcessingNotification(
    notification: DailyDisbursementReportProcessingNotification,
  ): Promise<void> {
    const auditUser = this.systemUsersService.systemUser;
    const { templateId, emailContacts } =
      await this.assertNotificationMessageDetails(
        NotificationMessageType.MinistryNotificationProvincialDailyDisbursementReceipt,
      );
    if (!emailContacts?.length) {
      return;
    }

    const ministryNotificationsToSend = emailContacts.map((emailContact) => ({
      userId: auditUser.id,
      messageType:
        NotificationMessageType.MinistryNotificationProvincialDailyDisbursementReceipt,
      messagePayload: {
        email_address: emailContact,
        template_id: templateId,
        personalisation: {
          application_file: {
            file: base64Encode(notification.attachmentFileContent),
            filename: notification.fileName,
            sending_method: "attach",
          },
        },
      } as NotificationEmailMessage,
    }));

    await this.notificationService.saveNotifications(
      ministryNotificationsToSend,
      auditUser.id,
    );
  }

  /**
   * Create supporting user information notification for student.
   * @param notification notification details.
   * @param entityManager entity manager to execute in transaction.
   */
  async saveSupportingUserInformationNotification(
    notification: SupportingUserInformationNotification,
    entityManager: EntityManager,
  ): Promise<void> {
    const auditUser = this.systemUsersService.systemUser;
    const { templateId } =
      await this.notificationMessageService.getNotificationMessageDetails(
        NotificationMessageType.SupportingUserInformationNotification,
      );
    const supportingUserInformationNotification = {
      userId: notification.userId,
      messageType:
        NotificationMessageType.SupportingUserInformationNotification,
      messagePayload: {
        email_address: notification.toAddress,
        template_id: templateId,
        personalisation: {
          givenNames: notification.givenNames ?? "",
          lastName: notification.lastName,
          supportingUserType: notification.supportingUserType,
        },
      },
    };
    await this.notificationService.saveNotifications(
      [supportingUserInformationNotification],
      auditUser.id,
      { entityManager },
    );
  }

  /**
   * Create supporting user information notification for student
   * when parent declaration is required from parent.
   * @param notification notification details.
   * @param entityManager entity manager to execute in transaction.
   */
  async saveParentInformationRequiredFromParentNotification(
    notification: ParentInformationRequiredFromParentNotification,
    entityManager: EntityManager,
  ): Promise<void> {
    const auditUser = this.systemUsersService.systemUser;
    const { templateId } =
      await this.notificationMessageService.getNotificationMessageDetails(
        NotificationMessageType.ParentInformationRequiredFromParentNotification,
      );
    const supportingUserInformationNotification = {
      userId: notification.userId,
      messageType:
        NotificationMessageType.ParentInformationRequiredFromParentNotification,
      messagePayload: {
        email_address: notification.toAddress,
        template_id: templateId,
        personalisation: {
          givenNames: notification.givenNames ?? "",
          lastName: notification.lastName,
          parentFullName: notification.parentFullName,
          applicationNumber: notification.applicationNumber,
          supportingUserType: notification.supportingUserType,
        },
      },
    };
    await this.notificationService.saveNotifications(
      [supportingUserInformationNotification],
      auditUser.id,
      { entityManager },
    );
  }

  /**
   * Create supporting user information notification for student
   * when parent declaration is required from student.
   * @param notification notification details.
   * @param entityManager entity manager to execute in transaction.
   */
  async saveParentInformationRequiredFromStudentNotification(
    notification: ParentInformationRequiredFromStudentNotification,
    entityManager: EntityManager,
  ): Promise<void> {
    const auditUser = this.systemUsersService.systemUser;
    const { templateId } =
      await this.notificationMessageService.getNotificationMessageDetails(
        NotificationMessageType.ParentInformationRequiredFromStudentNotification,
      );
    const supportingUserInformationNotification = {
      userId: notification.userId,
      messageType:
        NotificationMessageType.ParentInformationRequiredFromStudentNotification,
      messagePayload: {
        email_address: notification.toAddress,
        template_id: templateId,
        personalisation: {
          givenNames: notification.givenNames ?? "",
          lastName: notification.lastName,
          parentFullName: notification.parentFullName,
          applicationNumber: notification.applicationNumber,
          supportingUserType: notification.supportingUserType,
        },
      },
    };
    await this.notificationService.saveNotifications(
      [supportingUserInformationNotification],
      auditUser.id,
      { entityManager },
    );
  }

  /**
   * Asserts the notification message details of a notification message.
   * @param notificationMessageTypeId id of the user who will receive the message.
   * @returns notification details of the notification message.
   */
  private async assertNotificationMessageDetails(
    notificationMessageTypeId: NotificationMessageType,
  ): Promise<
    Pick<NotificationMessage, "templateId" | "emailContacts"> | undefined
  > {
    const { templateId, emailContacts } =
      await this.notificationMessageService.getNotificationMessageDetails(
        notificationMessageTypeId,
      );
    if (!emailContacts?.length) {
      this.logger.error(
        `Email template id ${notificationMessageTypeId} requires a configured email to be sent.`,
      );
      return { templateId, emailContacts };
    }
    return { templateId, emailContacts };
  }

  /**
   * Creates student application notification for student for PDPPD assessment.
   * @param notifications notification details array.
   * @param entityManager entity manager to execute in transaction.
   */
  async saveStudentApplicationPDPPDNotification(
    notifications: StudentPDPPDNotification[],
    entityManager?: EntityManager,
  ): Promise<void> {
    const auditUser = this.systemUsersService.systemUser;
    const { templateId } =
      await this.notificationMessageService.getNotificationMessageDetails(
        NotificationMessageType.StudentPDPPDApplicationNotification,
      );
    const notificationsToSend = notifications.map((notification) => ({
      userId: notification.userId,
      messageType: NotificationMessageType.StudentPDPPDApplicationNotification,
      messagePayload: {
        email_address: notification.email,
        template_id: templateId,
        personalisation: {
          givenNames: notification.givenNames ?? "",
          lastName: notification.lastName,
          applicationNumber: notification.applicationNumber,
        },
      },
      metadata: { assessmentId: notification.assessmentId },
    }));
    // Save notifications to be sent to the students into the notification table.
    await this.notificationService.saveNotifications(
      notificationsToSend,
      auditUser.id,
      { entityManager },
    );
  }

  /**
   * Creates student application notification for student for second disbursement reminder.
   * @param notifications notification details array.
   * @param entityManager entity manager to execute in transaction.
   */
  async saveStudentApplicationSecondDisbursementNotification(
    notifications: StudentSecondDisbursementNotification[],
    entityManager?: EntityManager,
  ): Promise<void> {
    const auditUser = this.systemUsersService.systemUser;
    const { templateId } =
      await this.notificationMessageService.getNotificationMessageDetails(
        NotificationMessageType.StudentSecondDisbursementNotification,
      );
    const notificationsToSend = notifications.map((notification) => ({
      userId: notification.userId,
      messageType:
        NotificationMessageType.StudentSecondDisbursementNotification,
      messagePayload: {
        email_address: notification.email,
        template_id: templateId,
        personalisation: {
          givenNames: notification.givenNames ?? "",
          lastName: notification.lastName,
        },
      },
      metadata: { assessmentId: notification.assessmentId },
    }));
    // Save notifications to be sent to the students into the notification table.
    await this.notificationService.saveNotifications(
      notificationsToSend,
      auditUser.id,
      { entityManager },
    );
  }

  @InjectLogger()
  declare logger: LoggerService;
}
