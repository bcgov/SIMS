import { Injectable } from "@nestjs/common";
import { STUDENT_FILE_UPLOAD_TEMPLATE_ID } from "../../utilities/notification-utils";
import { GcNotifyResult, RequestPayload } from "./gc-notify.model";
import { GcNotifyService } from "./gc-notify.service";

@Injectable()
export class GcNotifyActionsService {
  constructor(private readonly gcNotifyService: GcNotifyService) {}
  private async fileUploadEmailPayload(
    givenNames: string,
    lastName: string,
  ): Promise<RequestPayload> {
    return {
      email_address: this.gcNotifyService.gcNotifyToAddress(),
      template_id: STUDENT_FILE_UPLOAD_TEMPLATE_ID,
      personalisation: {
        givenNames: givenNames,
        lastName: lastName,
      },
    };
  }

  async sendFileUploadNotification(
    givenNames: string,
    lastName: string,
  ): Promise<GcNotifyResult> {
    return this.gcNotifyService.sendEmailNotification(
      await this.fileUploadEmailPayload(givenNames, lastName),
    );
  }
}
