import { Injectable } from "@nestjs/common";
import { Student } from "../../database/entities";
import { getExtendedDateFormat, getPSTPDTDateTime } from "../../utilities";
import { STUDENT_FILE_UPLOAD_TEMPLATE_ID } from "../../utilities/system-configurations-constants";
import { GCNotifyResult } from "./gc-notify.model";
import { GCNotifyService } from "./gc-notify.service";

@Injectable()
export class GCNotifyActionsService {
  constructor(private readonly gcNotifyService: GCNotifyService) {}

  /**
   * This method is used to send email notification to SBC
   * when a student uploads documents and submits it in the file uploader screen.
   * @param student
   * @param documentPurpose
   * @param applicationNumber
   * @returns GCNotifyResult
   */
  async sendFileUploadNotification(
    student: Student,
    documentPurpose: string,
    applicationNumber: string,
  ): Promise<GCNotifyResult> {
    const payload = {
      email_address: this.gcNotifyService.gcNotifyToAddress(),
      template_id: STUDENT_FILE_UPLOAD_TEMPLATE_ID,
      personalisation: {
        givenNames: student.user.firstName ?? "",
        lastName: student.user.lastName,
        dob: getExtendedDateFormat(student.birthDate),
        applicationNumber: applicationNumber,
        documentPurpose: documentPurpose,
        date: `${getPSTPDTDateTime(new Date())} PST/PDT`,
      },
    };
    return this.gcNotifyService.sendEmailNotification(payload);
  }
}
