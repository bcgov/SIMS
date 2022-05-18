import { Injectable } from "@nestjs/common";
import { getExtendedDateFormat, getPSTPDTDateTime } from "../../utilities";
import {
  MINISTRY_FILE_UPLOAD_TEMPLATE_ID,
  STUDENT_FILE_UPLOAD_TEMPLATE_ID,
} from "../../utilities/system-configurations-constants";
import {
  GCNotifyResult,
  MinistryStudentFileUploadNotification,
  MinistryStudentFileUploadPersonalisation,
  StudentFileUploadNotification,
  StudentFileUploadPersonalisation,
} from "./gc-notify.model";
import { GCNotifyService } from "./gc-notify.service";

@Injectable()
export class GCNotifyActionsService {
  constructor(private readonly gcNotifyService: GCNotifyService) {}

  /**
   * This method is used to send email notification to SABC
   * when a student uploads documents and submits it in the file uploader screen.
   * @param notification input parameters to generate the notification.
   * @returns GC Notify API call response.
   */
  async sendFileUploadNotification(
    notification: StudentFileUploadNotification,
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
        date: this.getDateTimeOnBCTimeZone(),
      },
    };
    return this.gcNotifyService.sendEmailNotification<StudentFileUploadPersonalisation>(
      payload,
    );
  }

  /**
   * Sends an email notification to the student when the Ministry uploads a file to his account.
   * @param notification input parameters to generate the notification.
   * @returns GC Notify API call response.
   */
  async sendMinistryFileUploadNotification(
    notification: MinistryStudentFileUploadNotification,
  ): Promise<GCNotifyResult> {
    const payload = {
      email_address: notification.toAddress,
      template_id: MINISTRY_FILE_UPLOAD_TEMPLATE_ID,
      personalisation: {
        givenNames: notification.firstName ?? "",
        lastName: notification.lastName,
        date: this.getDateTimeOnBCTimeZone(),
      },
    };
    return this.gcNotifyService.sendEmailNotification<MinistryStudentFileUploadPersonalisation>(
      payload,
    );
  }

  /**
   * Get the date and time converted to BC time-zone format
   * to be displayed in the messages.
   * @param date date to be formatted.
   * @returns Date and time as it should be displayed in the messages.
   */
  private getDateTimeOnBCTimeZone(date = new Date()): string {
    return `${getPSTPDTDateTime(date)} PST/PDT`;
  }
}
