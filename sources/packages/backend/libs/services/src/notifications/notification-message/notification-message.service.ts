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
   * Retrieves the template id of a notification message.
   * @param notificationMessageTypeId id of the user who will receive the message.
   * @param options options.
   * - `entityManager` external entity manager to run in a transaction.
   * @returns template Id of the notification message.
   */
  async getTemplateId(
    notificationMessageTypeId: NotificationMessageType,
    options?: { entityManager?: EntityManager },
  ): Promise<string> {
    const notificationMessageRepo =
      options?.entityManager?.getRepository(NotificationMessage) ?? this.repo;
    const notificationMessage = await notificationMessageRepo.findOne({
      select: {
        templateId: true,
      },
      where: {
        id: notificationMessageTypeId,
      },
    });
    return notificationMessage.templateId;
  }
}
