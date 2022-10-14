import { Injectable } from "@nestjs/common";
import {
  RecordDataModelService,
  NotificationMessage,
  NotificationMessageType,
} from "@sims/sims-db";
import { DataSource } from "typeorm";

@Injectable()
export class NotificationMessageService extends RecordDataModelService<NotificationMessage> {
  constructor(dataSource: DataSource) {
    super(dataSource.getRepository(NotificationMessage));
  }

  /**
   * Retrieves the template id of a notification message.
   * @param notificationMessageTypeId id of the user who will receive the message.
   * @returns template Id of the notification message.
   */
  async getTemplateId(
    notificationMessageTypeId: NotificationMessageType,
  ): Promise<string> {
    const notificationMessage = await this.repo.findOne({
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
