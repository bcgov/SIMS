import { Injectable } from "@nestjs/common";
import { NotificationMessageType } from "@sims/sims-db";
import { getDateOnlyFormat, getPSTPDTDateTime } from "@sims/utilities";
import { EntityManager } from "typeorm";
import { NotificationMessageService } from "../notification-message/notification-message.service";
import {
  StudentRestrictionAddedNotification,
  MinistryStudentFileUploadNotification,
  StudentFileUploadNotification,
  StudentRestrictionAddedNotificationOptions,
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
   * This method is used to send email notification to SABC
   * when a student uploads documents and submits it in the file uploader screen.
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
  ): Promise<number> {
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
    const [notificationId] = await this.notificationService.saveNotifications(
      [notificationToSend],
      auditUserId,
      entityManager,
    );

    return notificationId;
  }

  /**
   * Sends an email notification to the student when the Ministry uploads a file to his account.
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
  ): Promise<number> {
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
    const [notificationId] = await this.notificationService.saveNotifications(
      [notificationToSend],
      auditUserId,
      entityManager,
    );

    return notificationId;
  }

  /**
   * Creates a new notification when a new restriction is added to the student account.
   * @param notifications notifications information.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @param options options for the student restriction notification.
   */
  async saveStudentRestrictionAddedNotification(
    notifications: StudentRestrictionAddedNotification[],
    auditUserId: number,
    options?: StudentRestrictionAddedNotificationOptions,
  ): Promise<number[]> {
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
    return this.notificationService.saveNotifications(
      notificationsToSend,
      auditUserId,
      options?.entityManager,
    );
  }

  /**
   * Create exception complete notification to notify
   * student when an application exception is completed by ministry.
   * @param notification notification details.
   * @param auditUserId user who completes the exception.
   * @param entityManager entity manager to execute in transaction.
   * @returns notification created.
   */
  async createExceptionCompleteNotification(
    notification: StudentNotification,
    auditUserId: number,
    entityManager: EntityManager,
  ): Promise<number> {
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

    const [notificationId] = await this.notificationService.saveNotifications(
      [exceptionCompleteNotification],
      auditUserId,
      entityManager,
    );

    return notificationId;
  }

  /**
   * Create change request complete notification to notify student
   * when a change request is completed by ministry.
   * @param notification notification details.
   * @param auditUserId user who completes the change request.
   * @param entityManager entity manager to execute in transaction.
   * @returns notification created.
   */
  async createChangeRequestCompleteNotification(
    notification: StudentNotification,
    auditUserId: number,
    entityManager: EntityManager,
  ) {
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

    const [notificationId] = await this.notificationService.saveNotifications(
      [changeRequestCompleteNotification],
      auditUserId,
      entityManager,
    );

    return notificationId;
  }

  /**
   * Create institution report change notification to notify student
   * when institution reports a change to their application.
   * @param notification notification details.
   * @param auditUserId user who reports the change.
   * @param entityManager entity manager to execute in transaction.
   * @returns notification created.
   */
  async createInstitutionReportChangeNotification(
    notification: StudentNotification,
    auditUserId: number,
    entityManager: EntityManager,
  ) {
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

    const [notificationId] = await this.notificationService.saveNotifications(
      [institutionReportChangeNotification],
      auditUserId,
      entityManager,
    );

    return notificationId;
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
