import { Injectable } from "@nestjs/common";
import { NotificationMessageType } from "@sims/sims-db";
import { getDateOnlyFormat, getPSTPDTDateTime } from "@sims/utilities";
import { EntityManager } from "typeorm";
import { NotificationMessageService } from "../notification-message/notification-message.service";
import {
  StudentRestrictionAddedNotification,
  MinistryStudentFileUploadNotification,
  StudentFileUploadNotification,
} from "..";
import { GCNotifyService } from "./gc-notify.service";
import { NotificationService } from "./notification.service";

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
   * @returns GC Notify API call response.
   */
  async sendFileUploadNotification(
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
    const [notificationId] = await this.notificationService.saveNotifications(
      [notificationToSend],
      auditUserId,
      entityManager,
    );

    await this.notificationService.sendEmailNotification(
      notificationId,
      entityManager,
    );
  }

  /**
   * Sends an email notification to the student when the Ministry uploads a file to his account.
   * @param notification input parameters to generate the notification.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @param entityManager optional repository that can be provided, for instance,
   * to execute the command as part of an existing transaction. If not provided
   * the local repository will be used instead.
   * @returns GC Notify API call response.
   */
  async sendMinistryFileUploadNotification(
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
    const [notificationId] = await this.notificationService.saveNotifications(
      [notificationToSend],
      auditUserId,
      entityManager,
    );

    await this.notificationService.sendEmailNotification(
      notificationId,
      entityManager,
    );
  }

  /**
   * Creates a new notification when a new restriction is added to the student account.
   * @param notifications notifications information.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @param entityManager optional repository that can be provided, for instance,
   * to execute the command as part of an existing transaction. If not provided
   * the local repository will be used instead.
   */
  async sendStudentRestrictionAddedNotification(
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
    const notificationsIds = await this.notificationService.saveNotifications(
      notificationsToSend,
      auditUserId,
      entityManager,
    );

    // TODO: Temporary code to be removed once queue/schedulers are in place.
    for (const id of notificationsIds) {
      await this.notificationService.sendEmailNotification(id, entityManager);
    }
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
}
