import { Injectable } from "@nestjs/common";
import {
  RecordDataModelService,
  Notification,
  User,
  NotificationMessage,
  NotificationMessageType,
} from "@sims/sims-db";
import { DataSource, UpdateResult } from "typeorm";

@Injectable()
export class NotificationService extends RecordDataModelService<Notification> {
  constructor(dataSource: DataSource) {
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
    notification.createdAt = new Date();
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
}
