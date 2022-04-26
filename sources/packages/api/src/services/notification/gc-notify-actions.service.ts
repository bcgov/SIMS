import { Injectable } from "@nestjs/common";
import { Student } from "../../database/entities";
import { getExtendedDateFormat, getPSTPDTDate } from "../../utilities";
import { STUDENT_FILE_UPLOAD_TEMPLATE_ID } from "../../utilities/notification-utils";
import { GCNotifyResult, RequestPayload } from "./gc-notify.model";
import { GCNotifyService } from "./gc-notify.service";

@Injectable()
export class GCNotifyActionsService {
  constructor(private readonly gcNotifyService: GCNotifyService) {}
  private async fileUploadEmailPayload(
    student: Student,
    documentPurpose: string,
    applicationNumber: string,
  ): Promise<RequestPayload> {
    return {
      email_address: this.gcNotifyService.gcNotifyToAddress(),
      template_id: STUDENT_FILE_UPLOAD_TEMPLATE_ID,
      personalisation: {
        givenNames: student.user.firstName ? student.user.firstName : "",
        lastName: student.user.lastName,
        dob: getExtendedDateFormat(student.birthDate),
        applicationNumber: applicationNumber,
        documentPurpose: documentPurpose,
        date: getPSTPDTDate(new Date()),
      },
    };
  }

  async sendFileUploadNotification(
    student: Student,
    documentPurpose: string,
    applicationNumber: string,
  ): Promise<GCNotifyResult> {
    return this.gcNotifyService.sendEmailNotification(
      await this.fileUploadEmailPayload(
        student,
        documentPurpose,
        applicationNumber,
      ),
    );
  }
}
