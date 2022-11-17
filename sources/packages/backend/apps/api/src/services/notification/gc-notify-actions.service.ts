import { Injectable } from "@nestjs/common";
import { NotificationMessageType } from "@sims/sims-db";
import { getDateOnlyFormat, getPSTPDTDateTime } from "@sims/utilities";
import { NotificationMessageService } from "../notification-message/notification-message.service";
import {
  FederalStudentRestrictionPersonalization,
  GCNotifyResult,
  MinistryStudentFileUploadNotification,
  StudentFileUploadNotification,
} from "./gc-notify.model";
import { GCNotifyService } from "./gc-notify.service";
import { NotificationService } from "./notification.service";

@Injectable()
export class GCNotifyActionsService {
  constructor(
    private readonly gcNotifyService: GCNotifyService,
    private readonly notificationService: NotificationService,
    private readonly notificationMessageService: NotificationMessageService,
  ) {}

  /**
   * This method is used to send email notification to SABC
   * when a student uploads documents and submits it in the file uploader screen.
   * @param notification input parameters to generate the notification.
   * @param userId id of the user who will receive the message.
   * @param auditUserId id of the user creating the notification.
   * @returns GC Notify API call response.
   */
  async sendFileUploadNotification(
    notification: StudentFileUploadNotification,
    userId: number,
    auditUserId: number,
  ): Promise<GCNotifyResult> {
    const templateId = await this.notificationMessageService.getTemplateId(
      NotificationMessageType.StudentFileUpload,
    );
    const payload = {
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
    };
    // Save notification into notification table.
    const notificationSaved = await this.notificationService.saveNotification(
      userId,
      NotificationMessageType.StudentFileUpload,
      payload,
      auditUserId,
    );
    return this.notificationService.sendEmailNotification(notificationSaved.id);
  }

  /**
   * Sends an email notification to the student when the Ministry uploads a file to his account.
   * @param notification input parameters to generate the notification.
   * @param userId id of the user who will receive the message.
   * @param auditUserId id of the user creating the notification.
   * @returns GC Notify API call response.
   */
  async sendMinistryFileUploadNotification(
    notification: MinistryStudentFileUploadNotification,
    userId: number,
    auditUserId: number,
  ): Promise<GCNotifyResult> {
    const templateId = await this.notificationMessageService.getTemplateId(
      NotificationMessageType.MinistryFileUpload,
    );
    const payload = {
      email_address: notification.toAddress,
      template_id: templateId,
      personalisation: {
        givenNames: notification.firstName ?? "",
        lastName: notification.lastName,
        date: this.getDateTimeOnPSTTimeZone(),
      },
    };

    // Save notification into notification table.
    const notificationSaved = await this.notificationService.saveNotification(
      userId,
      NotificationMessageType.MinistryFileUpload,
      payload,
      auditUserId,
    );

    return this.notificationService.sendEmailNotification(notificationSaved.id);
  }

  async sendFederalStudentRestrictionNotification(
    notifications: FederalStudentRestrictionPersonalization[],
    auditUserId: number,
  ): Promise<void> {
    const templateId = await this.notificationMessageService.getTemplateId(
      NotificationMessageType.FederalStudentRestriction,
    );

    const notificationsToSend = notifications.map((notification) => ({
      userId: notification.userId,
      messageType: NotificationMessageType.FederalStudentRestriction,
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
}
