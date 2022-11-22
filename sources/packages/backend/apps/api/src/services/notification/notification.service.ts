import { Injectable } from "@nestjs/common";
import {
  RecordDataModelService,
  Notification,
  User,
  NotificationMessage,
  NotificationMessageType,
} from "@sims/sims-db";
import { DataSource, EntityManager, InsertResult, UpdateResult } from "typeorm";
import { GCNotifyResult } from "./gc-notify.model";
import { GCNotifyService } from "./gc-notify.service";
import { SaveNotificationModel } from "./notification.model";

/**
 * While performing a possible huge amount of inserts,
 * breaks the execution in chunks.
 */
const NOTIFICATIONS_INSERT_CHUNK_SIZE = 1000;

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
   * @param auditUserId id of the user creating the notification.
   * @param messagePayload notification payload.
   * @returns payload of the record created.
   * @deprecated please use saveNotifications method instead.
   */
  async saveNotification(
    userId: number,
    messageType: NotificationMessageType,
    messagePayload: unknown,
    auditUserId: number,
  ): Promise<Notification> {
    const notification = new Notification();
    notification.user = { id: userId } as User;
    notification.creator = { id: auditUserId } as User;
    notification.messagePayload = messagePayload;
    notification.notificationMessage = {
      id: messageType,
    } as NotificationMessage;

    return this.repo.save(notification);
  }

  /**
   * Saves all notifications.
   * @param notifications information to create the notifications.
   * @param auditUserId id of the user creating the notifications.
   * @param entityManager optional repository that can be provided, for instance,
   * to execute the command as part of an existing transaction. If not provided
   * the local repository will be used instead.
   * @returns created notification ids.
   */
  async saveNotifications(
    notifications: SaveNotificationModel[],
    auditUserId: number,
    entityManager: EntityManager,
  ): Promise<number[]> {
    const newNotifications = notifications.map((notification) => ({
      user: { id: notification.userId } as User,
      creator: { id: auditUserId } as User,
      messagePayload: notification.messagePayload,
      notificationMessage: {
        id: notification.messageType,
      } as NotificationMessage,
    }));
    const repository = entityManager?.getRepository(Notification) ?? this.repo;
    // Breaks the execution in chunks to allow the inserts of a huge amount of records.
    // During the tests the execution started to failed at 20,000 records. Even not being
    // the expected amount of records, the code will be able to process this amount under
    // an unusual circumstance. The TypeOrm "save" method has the chunk size as an option
    // but the TypeOrm "insert" performance is way better due to the simplicity of the operation.
    const insertResults: InsertResult[] = [];
    while (newNotifications.length) {
      const insertChunk = newNotifications.splice(
        0,
        NOTIFICATIONS_INSERT_CHUNK_SIZE,
      );
      const insertResult = await repository.insert(insertChunk);
      insertResults.push(insertResult);
    }
    return insertResults
      .flatMap((insertResult) => insertResult.identifiers)
      .map((identifier) => +identifier.id);
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
    // Call GC Notify send email method.
    const gcNotifyResult = await this.gcNotifyService.sendEmailNotification(
      notification.messagePayload,
    );

    // Update date sent column in notification table after sending email notification successfully.
    await this.updateNotification(notification.id);

    return gcNotifyResult;
  }
}
