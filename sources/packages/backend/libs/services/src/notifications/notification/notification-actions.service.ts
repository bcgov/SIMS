import { Injectable } from "@nestjs/common";
import { NotificationMessageType } from "@sims/sims-db";
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
  DisbursementBlockedNotificationForMinistry,
  ApplicationExceptionRequestNotificationForMinistry,
  ApplicationEditedFifthTimeNotificationForMinistry,
  StudentSubmittedChangeRequestNotificationForMinistry,
  InstitutionRequestsDesignationNotificationForMinistry,
} from "..";
import { NotificationService } from "./notification.service";
import { InjectLogger, LoggerService } from "@sims/utilities/logger";
import { ECE_RESPONSE_ATTACHMENT_FILE_NAME } from "@sims/integrations/constants";
import { SystemUsersService } from "@sims/services/system-users";

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
    const notificationDetails =
      await this.notificationMessageService.getNotificationDetails(
        NotificationMessageType.StudentFileUpload,
      );
    const ministryNotificationsToSend = [];
    notificationDetails.emailContacts.forEach((emailContact) => {
      const notificationToSend = {
        userId: notification.userId,
        messageType: NotificationMessageType.StudentFileUpload,
        messagePayload: {
          email_address: emailContact,
          template_id: notificationDetails.templateId,
          personalisation: {
            givenNames: notification.firstName ?? "",
            lastName: notification.lastName,
            dob: getDateOnlyFormat(notification.birthDate),
            applicationNumber: notification.applicationNumber,
            documentPurpose: notification.documentPurpose,
            date: this.getDateTimeOnPSTTimeZone(),
          },
        },
      };
      ministryNotificationsToSend.push(notificationToSend);
    });

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
    const notificationDetails =
      await this.notificationMessageService.getNotificationDetails(
        NotificationMessageType.MinistryFileUpload,
      );

    const notificationToSend = {
      userId: notification.userId,
      messageType: NotificationMessageType.MinistryFileUpload,
      messagePayload: {
        email_address: notification.toAddress,
        template_id: notificationDetails.templateId,
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
    const notificationDetails =
      await this.notificationMessageService.getNotificationDetails(
        NotificationMessageType.MSFAACancellation,
      );

    const messagePayload: NotificationEmailMessage = {
      email_address: notification.toAddress,
      template_id: notificationDetails.templateId,
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
    const notificationDetails =
      await this.notificationMessageService.getNotificationDetails(
        NotificationMessageType.ApplicationOfferingChangeRequestInProgressWithStudent,
      );
    const messagePayload: NotificationEmailMessage = {
      email_address: notification.toAddress,
      template_id: notificationDetails.templateId,
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
    const notificationDetails =
      await this.notificationMessageService.getNotificationDetails(
        NotificationMessageType.ApplicationOfferingChangeRequestCompletedByMinistry,
      );
    const messagePayload: NotificationEmailMessage = {
      email_address: notification.toAddress,
      template_id: notificationDetails.templateId,
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
    const notificationDetails =
      await this.notificationMessageService.getNotificationDetails(
        NotificationMessageType.StudentRestrictionAdded,
      );

    const notificationsToSend = notifications.map((notification) => ({
      userId: notification.userId,
      messageType: NotificationMessageType.StudentRestrictionAdded,
      messagePayload: {
        email_address: notification.toAddress,
        template_id: notificationDetails.templateId,
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
    const notificationDetails =
      await this.notificationMessageService.getNotificationDetails(
        NotificationMessageType.LegacyRestrictionAdded,
      );
    const ministryNotificationsToSend = [];
    notificationDetails.emailContacts.forEach((emailContact) => {
      const notificationsToSend = notifications.map((notification) => ({
        userId: notification.userId,
        messageType: NotificationMessageType.LegacyRestrictionAdded,
        messagePayload: {
          email_address: emailContact,
          template_id: notificationDetails.templateId,
          personalisation: {
            givenNames: notification.firstName ?? "",
            lastName: notification.lastName,
            studentEmail: notification.email,
            dob: getDateOnlyFormat(notification.birthDate),
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
    const notificationDetails =
      await this.notificationMessageService.getNotificationDetails(
        NotificationMessageType.MinistryCompletesException,
      );

    const exceptionCompleteNotification = {
      userId: notification.userId,
      messageType: NotificationMessageType.MinistryCompletesException,
      messagePayload: {
        email_address: notification.toAddress,
        template_id: notificationDetails.templateId,
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
    const notificationDetails =
      await this.notificationMessageService.getNotificationDetails(
        NotificationMessageType.MinistryCompletesChange,
      );

    const changeRequestCompleteNotification = {
      userId: notification.userId,
      messageType: NotificationMessageType.MinistryCompletesChange,
      messagePayload: {
        email_address: notification.toAddress,
        template_id: notificationDetails.templateId,
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
    const notificationDetails =
      await this.notificationMessageService.getNotificationDetails(
        NotificationMessageType.InstitutionReportsChange,
      );

    const institutionReportChangeNotification = {
      userId: notification.userId,
      messageType: NotificationMessageType.InstitutionReportsChange,
      messagePayload: {
        email_address: notification.toAddress,
        template_id: notificationDetails.templateId,
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
    const notificationDetails =
      await this.notificationMessageService.getNotificationDetails(
        NotificationMessageType.InstitutionCompletesPIR,
      );

    const institutionCompletePIRNotification = {
      userId: notification.userId,
      messageType: NotificationMessageType.InstitutionCompletesPIR,
      messagePayload: {
        email_address: notification.toAddress,
        template_id: notificationDetails.templateId,
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
    const notificationDetails =
      await this.notificationMessageService.getNotificationDetails(
        NotificationMessageType.InstitutionCompletesCOE,
      );

    const institutionConfirmCOENotification = {
      userId: notification.userId,
      messageType: NotificationMessageType.InstitutionCompletesCOE,
      messagePayload: {
        email_address: notification.toAddress,
        template_id: notificationDetails.templateId,
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
    const notificationDetails =
      await this.notificationMessageService.getNotificationDetails(
        NotificationMessageType.AssessmentReadyForConfirmation,
        { entityManager },
      );
    const assessmentReadyNotification = {
      userId: notification.userId,
      messageType: NotificationMessageType.AssessmentReadyForConfirmation,
      messagePayload: {
        email_address: notification.toAddress,
        template_id: notificationDetails.templateId,
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
    const notificationDetails =
      await this.notificationMessageService.getNotificationDetails(
        NotificationMessageType.SINValidationComplete,
      );
    const sinCompleteNotification = {
      userId: notification.userId,
      messageType: NotificationMessageType.SINValidationComplete,
      messagePayload: {
        email_address: notification.toAddress,
        template_id: notificationDetails.templateId,
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
    const notificationDetails =
      await this.notificationMessageService.getNotificationDetails(
        NotificationMessageType.ECEResponseFileProcessing,
      );
    const eceResponseFileProcessingNotifications = [];

    for (const integrationContact of notification.integrationContacts) {
      const messagePayload: NotificationEmailMessage = {
        email_address: integrationContact,
        template_id: notificationDetails.templateId,
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
    const notificationDetails =
      await this.notificationMessageService.getNotificationDetails(
        NotificationMessageType.StudentNotificationDisbursementBlocked,
      );
    const notificationToSend = {
      userId: notification.userId,
      messageType:
        NotificationMessageType.StudentNotificationDisbursementBlocked,
      messagePayload: {
        email_address: notification.toAddress,
        template_id: notificationDetails.templateId,
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
    notification: DisbursementBlockedNotificationForMinistry,
    disbursementId: number,
    entityManager: EntityManager,
  ): Promise<void> {
    const auditUser = this.systemUsersService.systemUser;
    const notificationDetails =
      await this.notificationMessageService.getNotificationDetails(
        NotificationMessageType.MinistryNotificationDisbursementBlocked,
      );
    const ministryNotificationsToSend = [];
    notificationDetails.emailContacts.forEach((emailContact) => {
      const ministryNotificationToSend = {
        userId: auditUser.id,
        messageType:
          NotificationMessageType.MinistryNotificationDisbursementBlocked,
        messagePayload: {
          email_address: emailContact,
          template_id: notificationDetails.templateId,
          personalisation: {
            givenNames: notification.givenNames ?? "",
            lastName: notification.lastName,
            dob: getDateOnlyFormat(notification.dob),
            studentEmail: notification.email,
            applicationNumber: notification.applicationNumber,
            dateTime: this.getDateTimeOnPSTTimeZone(),
          },
        },
        metadata: { disbursementId },
      };
      ministryNotificationsToSend.push(ministryNotificationToSend);
    });
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
  async saveApplicationExceptionRequestNotificationForMinistry(
    notification: ApplicationExceptionRequestNotificationForMinistry,
    entityManager: EntityManager,
  ): Promise<void> {
    const auditUser = this.systemUsersService.systemUser;
    const notificationDetails =
      await this.notificationMessageService.getNotificationDetails(
        NotificationMessageType.MinistryNotificationApplicationExceptionRequest,
      );
    const ministryNotificationsToSend = [];
    notificationDetails.emailContacts.forEach((emailContact) => {
      const ministryNotificationToSend = {
        userId: auditUser.id,
        messageType:
          NotificationMessageType.MinistryNotificationApplicationExceptionRequest,
        messagePayload: {
          email_address: emailContact,
          template_id: notificationDetails.templateId,
          personalisation: {
            givenNames: notification.givenNames ?? "",
            lastName: notification.lastName,
            dob: getDateOnlyFormat(notification.dob),
            studentEmail: notification.email,
            applicationNumber: notification.applicationNumber,
            dateTime: this.getDateTimeOnPSTTimeZone(),
          },
        },
      };
      ministryNotificationsToSend.push(ministryNotificationToSend);
    });
    // Save notifications to be sent to the ministry into the notification table.
    await this.notificationService.saveNotifications(
      ministryNotificationsToSend,
      auditUser.id,
      { entityManager },
    );
  }

  /**
   * Creates application edited 5th time notification for ministry.
   * @param notification notification details.
   * @param entityManager entity manager to execute in transaction.
   */
  async saveApplicationEditedFifthTimeNotificationForMinistry(
    notification: ApplicationEditedFifthTimeNotificationForMinistry,
    entityManager: EntityManager,
  ): Promise<void> {
    const auditUser = this.systemUsersService.systemUser;
    const notificationDetails =
      await this.notificationMessageService.getNotificationDetails(
        NotificationMessageType.MinistryNotificationApplicationEditedFifthTime,
      );
    const ministryNotificationsToSend = [];
    notificationDetails.emailContacts.forEach((emailContact) => {
      const ministryNotificationToSend = {
        userId: auditUser.id,
        messageType:
          NotificationMessageType.MinistryNotificationApplicationEditedFifthTime,
        messagePayload: {
          email_address: emailContact,
          template_id: notificationDetails.templateId,
          personalisation: {
            givenNames: notification.givenNames ?? "",
            lastName: notification.lastName,
            dob: getDateOnlyFormat(notification.dob),
            studentEmail: notification.email,
            applicationNumber: notification.applicationNumber,
            dateTime: this.getDateTimeOnPSTTimeZone(),
          },
        },
      };
      ministryNotificationsToSend.push(ministryNotificationToSend);
    });
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
  async saveStudentSubmittedChangeRequestNotificationForMinistry(
    notification: StudentSubmittedChangeRequestNotificationForMinistry,
    entityManager: EntityManager,
  ): Promise<void> {
    const auditUser = this.systemUsersService.systemUser;
    const notificationDetails =
      await this.notificationMessageService.getNotificationDetails(
        NotificationMessageType.StudentSubmittedChangeRequestNotificationForMinistry,
      );
    const ministryNotificationsToSend = [];
    notificationDetails.emailContacts.forEach((emailContact) => {
      const ministryNotificationToSend = {
        userId: auditUser.id,
        messageType:
          NotificationMessageType.StudentSubmittedChangeRequestNotificationForMinistry,
        messagePayload: {
          email_address: emailContact,
          template_id: notificationDetails.templateId,
          personalisation: {
            givenNames: notification.givenNames ?? "",
            lastName: notification.lastName,
            dob: getDateOnlyFormat(notification.dob),
            studentEmail: notification.email,
            applicationNumber: notification.applicationNumber,
            dateTime: this.getDateTimeOnPSTTimeZone(),
          },
        },
      };
      ministryNotificationsToSend.push(ministryNotificationToSend);
    });
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
  async saveStudentRequestsBasicBCeIDAccountNotificationForMinistry(
    notification: StudentSubmittedChangeRequestNotificationForMinistry,
    entityManager: EntityManager,
  ): Promise<void> {
    const auditUser = this.systemUsersService.systemUser;
    const notificationDetails =
      await this.notificationMessageService.getNotificationDetails(
        NotificationMessageType.StudentRequestsBasicBCeIDAccountNotificationForMinistry,
      );
    const ministryNotificationsToSend = [];
    notificationDetails.emailContacts.forEach((emailContact) => {
      const ministryNotificationToSend = {
        userId: auditUser.id,
        messageType:
          NotificationMessageType.StudentRequestsBasicBCeIDAccountNotificationForMinistry,
        messagePayload: {
          email_address: emailContact,
          template_id: notificationDetails.templateId,
          personalisation: {
            givenNames: notification.givenNames ?? "",
            lastName: notification.lastName,
            dob: getDateOnlyFormat(notification.dob),
            studentEmail: notification.email,
            applicationNumber: notification.applicationNumber,
            dateTime: this.getDateTimeOnPSTTimeZone(),
          },
        },
      };
      ministryNotificationsToSend.push(ministryNotificationToSend);
    });
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
  async saveInstitutionRequestsDesignationNotificationForMinistry(
    notification: InstitutionRequestsDesignationNotificationForMinistry,
    entityManager: EntityManager,
  ): Promise<void> {
    const auditUser = this.systemUsersService.systemUser;
    const notificationDetails =
      await this.notificationMessageService.getNotificationDetails(
        NotificationMessageType.InstitutionRequestsDesignationNotificationForMinistry,
      );
    const ministryNotificationsToSend = [];
    notificationDetails.emailContacts.forEach((emailContact) => {
      const ministryNotificationToSend = {
        userId: auditUser.id,
        messageType:
          NotificationMessageType.InstitutionRequestsDesignationNotificationForMinistry,
        messagePayload: {
          email_address: emailContact,
          template_id: notificationDetails.templateId,
          personalisation: {
            institutionOperatingName: notification.institutionOperatingName,
            institutionLocationName: notification.institutionLocationName,
            programName: notification.programName,
            offeringName: notification.offeringName,
            institutionPrimaryEmail: notification.institutionPrimaryEmail,
            dateTime: this.getDateTimeOnPSTTimeZone(),
          },
        },
      };
      ministryNotificationsToSend.push(ministryNotificationToSend);
    });
    // Save notifications to be sent to the ministry into the notification table.
    await this.notificationService.saveNotifications(
      ministryNotificationsToSend,
      auditUser.id,
      { entityManager },
    );
  }

  @InjectLogger()
  logger: LoggerService;
}
