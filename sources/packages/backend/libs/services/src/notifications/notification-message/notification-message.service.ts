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
    return notificationMessageRepo.findOneOrFail({
      select: {
        templateId: true,
        emailContacts: true,
      },
      where: {
        id: notificationMessageTypeId,
      },
    });
  }

  /**
   * Retrieves the notification message associated with the provided GC Notify
   * template id. The notification messages are expected to be previously seeded
   * through a database migration, hence an error is raised when none is found
   * for the provided template id, allowing the caller (e.g. a workflow job) to
   * fail and raise an incident to be investigated.
   * @param templateId GC Notify template id.
   * @param options options.
   * - `entityManager` external entity manager to run in a transaction.
   * @returns notification message details for the provided template id.
   */
  async getNotificationMessageByTemplateId(
    templateId: string,
    options?: { entityManager?: EntityManager },
  ): Promise<NotificationMessage> {
    const notificationMessageRepo =
      options?.entityManager?.getRepository(NotificationMessage) ?? this.repo;
    return notificationMessageRepo.findOneOrFail({
      select: {
        id: true,
        templateId: true,
        emailContacts: true,
      },
      where: {
        templateId,
      },
    });
  }
}
