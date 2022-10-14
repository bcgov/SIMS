import { Injectable } from "@nestjs/common";
import { NotificationMessageType } from "@sims/sims-db";
import { getExtendedDateFormat, getPSTPDTDateTime } from "../../utilities";
import {
  MINISTRY_FILE_UPLOAD_TEMPLATE_ID,
  STUDENT_FILE_UPLOAD_TEMPLATE_ID,
} from "../../utilities/system-configurations-constants";
import {
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
    const payload = {
      email_address: this.gcNotifyService.ministryToAddress(),
      template_id: STUDENT_FILE_UPLOAD_TEMPLATE_ID,
      personalisation: {
        givenNames: notification.firstName ?? "",
        lastName: notification.lastName,
        dob: getExtendedDateFormat(notification.birthDate),
        applicationNumber: notification.applicationNumber,
        documentPurpose: notification.documentPurpose,
        date: this.getDateTimeOnPSTTimeZone(),
      },
    };
    // Save notification into notification table.
    const notificationSaved = await this.notificationService.saveNotification(
      userId,
      NotificationMessageType.StudentFileUpload,
      STUDENT_FILE_UPLOAD_TEMPLATE_ID,
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
    const payload = {
      email_address: notification.toAddress,
      template_id: MINISTRY_FILE_UPLOAD_TEMPLATE_ID,
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
      MINISTRY_FILE_UPLOAD_TEMPLATE_ID,
      payload,
      auditUserId,
    );

    return this.notificationService.sendEmailNotification(notificationSaved.id);
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
