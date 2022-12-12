import { Injectable } from "@nestjs/common";
import { NotificationMessageType } from "@sims/sims-db";
import { getDateOnlyFormat, getPSTPDTDateTime } from "@sims/utilities";
import { EntityManager } from "typeorm";
import { NotificationMessageService } from "../notification-message/notification-message.service";
import {
  StudentRestrictionAddedNotification,
  MinistryStudentFileUploadNotification,
  StudentFileUploadNotification,
  StudentNotification,
} from "..";
import { GCNotifyService } from "./gc-notify.service";
import { NotificationService } from "./notification.service";
import { InjectLogger, LoggerService } from "@sims/utilities/logger";

@Injectable()
export class NotificationActionsService {
  constructor(
    private readonly gcNotifyService: GCNotifyService,
    private readonly notificationService: NotificationService,
    private readonly notificationMessageService: NotificationMessageService,
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
    const templateId = await this.notificationMessageService.getTemplateId(
      NotificationMessageType.StudentFileUpload,
    );
    const notificationToSend = {
      userId: notification.userId,
      messageType: NotificationMessageType.StudentFileUpload,
      messagePayload: {
        email_address: this.gcNotifyService.ministryToAddress(),
        template_id: templateId,
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

    // Save notification into notification table.
    await this.notificationService.saveNotifications(
      [notificationToSend],
      auditUserId,
      entityManager,
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
    const templateId = await this.notificationMessageService.getTemplateId(
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
      entityManager,
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
    const templateId = await this.notificationMessageService.getTemplateId(
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
      entityManager,
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
    const templateId = await this.notificationMessageService.getTemplateId(
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
      entityManager,
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
    const templateId = await this.notificationMessageService.getTemplateId(
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
      entityManager,
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
    const templateId = await this.notificationMessageService.getTemplateId(
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
      entityManager,
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
    const templateId = await this.notificationMessageService.getTemplateId(
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
      entityManager,
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
    const templateId = await this.notificationMessageService.getTemplateId(
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
      entityManager,
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

  @InjectLogger()
  logger: LoggerService;
}
