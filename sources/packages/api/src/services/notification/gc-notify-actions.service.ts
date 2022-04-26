import { Injectable } from "@nestjs/common";
import { Student } from "src/database/entities";
import { STUDENT_FILE_UPLOAD_TEMPLATE_ID } from "../../utilities/notification-utils";
import { GcNotifyResult, RequestPayload } from "./gc-notify.model";
import { GcNotifyService } from "./gc-notify.service";

@Injectable()
export class GcNotifyActionsService {
  constructor(private readonly gcNotifyService: GcNotifyService) {}
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
        dob: student.birthDate,
        applicationNumber: applicationNumber,
        documentPurpose: documentPurpose,
        date: new Date(),
      },
    };
  }

  async sendFileUploadNotification(
    student: Student,
    documentPurpose: string,
    applicationNumber: string,
  ): Promise<GcNotifyResult> {
    return this.gcNotifyService.sendEmailNotification(
      await this.fileUploadEmailPayload(
        student,
        documentPurpose,
        applicationNumber,
      ),
    );
  }
}
