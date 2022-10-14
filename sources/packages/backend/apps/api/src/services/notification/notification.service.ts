import { Injectable } from "@nestjs/common";
import {
  RecordDataModelService,
  Notification,
  User,
  NotificationMessage,
  NotificationMessageType,
} from "@sims/sims-db";
import { DataSource, UpdateResult } from "typeorm";
import {
  GCNotifyResult,
  StudentFileUploadPersonalization,
} from "./gc-notify.model";
import { GCNotifyService } from "./gc-notify.service";

@Injectable()
export class NotificationService extends RecordDataModelService<Notification> {
  constructor(
    dataSource: DataSource,
    private readonly gcNotifyService: GCNotifyService,
  ) {
    super(dataSource.getRepository(Notification));
  }

  /**
   * Creates the inbox notification record.
   * @param userId id of the user who will receive the message.
   * @param messageType message type of the notification.
   * @param templateId template id of the notification.
   * @param auditUserId id of the user creating the notification.
   * @param messagePayload notification payload.
   * @returns payload of the record created.
   */
  async saveNotification(
    userId: number,
    messageType: NotificationMessageType,
    templateId: string,
    messagePayload: unknown,
    auditUserId: number,
  ): Promise<Notification> {
    const notification = new Notification();
    notification.templateId = templateId;
    notification.user = { id: userId } as User;
    notification.creator = { id: auditUserId } as User;
    notification.messagePayload = messagePayload;
    notification.notificationMessage = {
      id: messageType,
    } as NotificationMessage;

    return this.repo.save(notification);
  }

  /**
   * Updates the date sent column of the inbox notification record.
   * @param notificationId notification id.
   * @returns result of the record updated.
   */
  async updateNotification(notificationId: number): Promise<UpdateResult> {
    return this.repo.update(
      {
        id: notificationId,
      },
      { dateSent: new Date() },
    );
  }

  /**
   * Invokes the sendEmailNotification method of the GC Notification service.
   * @param notificationId notification id used to retrieve the payload that will be passed
   * as a parameter to the sendMailNotification method.
   * @returns GC Notify API call response.
   */
  async sendEmailNotification(notificationId: number): Promise<GCNotifyResult> {
    const notification = await this.repo.findOne({
      select: {
        id: true,
        messagePayload: true,
      },
      where: {
        id: notificationId,
      },
    });
    // call GC Notify send email method.
    const gcNotifyResult =
      await this.gcNotifyService.sendEmailNotification<StudentFileUploadPersonalization>(
        notification.messagePayload,
      );

    // Update date sent column in notification table after sending email notification successfully.
    await this.updateNotification(notification.id);

    return gcNotifyResult;
  }
}
