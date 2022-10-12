import { Injectable } from "@nestjs/common";
import {
  RecordDataModelService,
  Notification,
  User,
  Message,
  MessageType,
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
   * @param gcNotifyPayload notification payload.
   * @returns payload of the record created.
   */
  async saveNotification(
    userId: number,
    messageType: MessageType,
    templateId: string,
    gcNotifyPayload: unknown,
    auditUserId: number,
  ): Promise<Notification> {
    const now = new Date();
    const notification = new Notification();
    notification.templateId = templateId;
    notification.user = { id: userId } as User;
    notification.creator = { id: auditUserId } as User;
    notification.gcNotifyPayload = gcNotifyPayload;
    notification.createdAt = now;
    notification.message = { id: messageType } as Message;
    return this.repo.save(notification);
  }

  /**
   * Updates the date sent column of the inbox notification record.
   * @param notificationId notification id.
   * @returns result of the record updated.
   */
  async updateNotification(notificationId: number): Promise<UpdateResult> {
    const now = new Date();
    return this.repo.update(
      {
        id: notificationId,
      },
      { dateSent: now },
    );
  }
}
