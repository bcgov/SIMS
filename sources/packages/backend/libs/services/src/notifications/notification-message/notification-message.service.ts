import { Injectable } from "@nestjs/common";
import {
  RecordDataModelService,
  NotificationMessage,
  NotificationMessageType,
} from "@sims/sims-db";
import { DataSource, EntityManager, Repository } from "typeorm";

/**
 * Base id used to generate the primary key of notification messages that are
 * automatically created at runtime (e.g. templates triggered by a workflow that
 * were not previously seeded through a database migration). The high value keeps
 * these ids in a reserved range, avoiding collisions with the ids manually
 * assigned to the well-known notification messages defined in migrations.
 */
const AUTO_GENERATED_NOTIFICATION_MESSAGE_ID_BASE = 1000000;

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
   * template id, creating a new notification message record when none exists.
   * This allows workflows to trigger emails for templates that were not
   * previously seeded through a database migration, requiring no code or
   * migration changes to start sending a new notification.
   * @param templateId GC Notify template id.
   * @param options options.
   * - `entityManager` external entity manager to run in a transaction.
   * @returns notification message details for the provided template id.
   */
  async getOrCreateNotificationMessageByTemplateId(
    templateId: string,
    options?: { entityManager?: EntityManager },
  ): Promise<NotificationMessage> {
    const notificationMessageRepo =
      options?.entityManager?.getRepository(NotificationMessage) ?? this.repo;

    const existingMessage = await this.getNotificationMessageByTemplateId(
      templateId,
      notificationMessageRepo,
    );
    if (existingMessage) {
      return existingMessage;
    }
    // Create a new notification message when none exists for the provided template id.
    return this.createNotificationMessage(templateId, notificationMessageRepo);
  }

  /**
   * Retrieves the notification message associated with the provided GC Notify template id.
   * @param templateId GC Notify template id.
   * @param notificationMessageRepo notification message repository.
   * @returns notification message details for the provided template id.
   */
  private async getNotificationMessageByTemplateId(
    templateId: string,
    notificationMessageRepo: Repository<NotificationMessage>,
  ): Promise<NotificationMessage> {
    const existingMessage = await notificationMessageRepo.findOne({
      select: {
        id: true,
        templateId: true,
        emailContacts: true,
      },
      where: {
        templateId,
      },
      order: {
        id: "ASC",
      },
    });
    return existingMessage;
  }

  /**
   * Creates a new notification message for the provided GC Notify template id.
   * @param templateId GC Notify template id.
   * @param notificationMessageRepo notification message repository.
   * @returns notification message details for the newly created template id.
   */
  private async createNotificationMessage(
    templateId: string,
    notificationMessageRepo: Repository<NotificationMessage>,
  ): Promise<NotificationMessage> {
    // Reserve a high id range for the auto-generated notification messages to
    // avoid collisions with the ids manually assigned through migrations.
    const maxIdResult = await notificationMessageRepo
      .createQueryBuilder("notificationMessage")
      .select("MAX(notificationMessage.id)", "maxId")
      .where("notificationMessage.id >= :base", {
        base: AUTO_GENERATED_NOTIFICATION_MESSAGE_ID_BASE,
      })
      .getRawOne<{ maxId: number }>();
    const nextId =
      (maxIdResult?.maxId ?? AUTO_GENERATED_NOTIFICATION_MESSAGE_ID_BASE - 1) +
      1;
    await notificationMessageRepo.insert({
      id: nextId,
      templateId,
      description: `Auto-generated notification message for the template ${templateId}.`,
    });
    return this.getNotificationMessageByTemplateId(
      templateId,
      notificationMessageRepo,
    );
  }
}
