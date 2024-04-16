import { Injectable } from "@nestjs/common";
import {
  RecordDataModelService,
  NotificationMessage,
  NotificationMessageType,
} from "@sims/sims-db";
import { DataSource, EntityManager } from "typeorm";

@Injectable()
export class NotificationMessageService extends RecordDataModelService<NotificationMessage> {
  constructor(dataSource: DataSource) {
    super(dataSource.getRepository(NotificationMessage));
  }

  /**
   * Retrieves the notification message details of a notification message.
   * @param notificationMessageTypeId id of the user who will receive the message.
   * @param options options.
   * - `entityManager` external entity manager to run in a transaction.
   * @returns notification details of the notification message.
   */
  async getNotificationMessageDetails(
    notificationMessageTypeId: NotificationMessageType,
    options?: { entityManager?: EntityManager },
  ): Promise<Pick<NotificationMessage, "templateId" | "emailContacts">> {
    const notificationMessageRepo =
      options?.entityManager?.getRepository(NotificationMessage) ?? this.repo;
    const { templateId, emailContacts } = await notificationMessageRepo.findOne(
      {
        select: {
          templateId: true,
          emailContacts: true,
        },
        where: {
          id: notificationMessageTypeId,
        },
      },
    );
    return { templateId, emailContacts };
  }
}
