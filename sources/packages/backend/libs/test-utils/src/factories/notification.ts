import { NotificationEmailMessage } from "@sims/services";
import {
  Notification,
  NotificationMessage,
  NotificationMessageType,
  User,
} from "@sims/sims-db";
import { faker } from "@faker-js/faker";
import { DataSource } from "typeorm";

/**
 * Creates a fake message payload.
 * @returns created message payload.
 */
function createDummyMessagePayload(): NotificationEmailMessage {
  return {
    email_address: faker.internet.email(),
    template_id: faker.string.uuid(),
    personalisation: {
      givenNames: faker.person.firstName(),
      lastName: faker.person.lastName(),
    },
  };
}

/**
 *
 * @param relations notification entity relations.
 * - `user` related user.
 * - `auditUser` related audit user.
 * - `notificationMessage` related notification message.
 * @param options notification options.
 * - `initialValue` notification initial values.
 * @returns created notification.
 */
export function createFakeNotification(
  relations?: {
    user?: User;
    auditUser?: User;
    notificationMessage?: NotificationMessage;
  },
  options?: {
    initialValue?: Partial<Notification>;
  },
): Notification {
  const notification = new Notification();
  notification.user = relations?.user;
  notification.notificationMessage =
    relations?.notificationMessage ??
    ({
      id: NotificationMessageType.StudentFileUpload,
    } as NotificationMessage);
  notification.metadata = options?.initialValue?.metadata ?? null;
  notification.messagePayload =
    options?.initialValue?.messagePayload ?? createDummyMessagePayload();
  notification.creator = relations?.auditUser ?? null;
  notification.createdAt = options?.initialValue?.createdAt;
  notification.dateSent = options?.initialValue?.dateSent;
  return notification;
}

/**
 * Creates a fake notification message (the template that defines a notification,
 * seeded in the database during migrations) without persisting it.
 * @param options notification message options.
 * - `initialValue` notification message initial values.
 * @returns created notification message.
 */
export function createFakeNotificationMessage(options?: {
  initialValue?: Partial<NotificationMessage>;
}): NotificationMessage {
  const notificationMessage = new NotificationMessage();
  notificationMessage.id = options?.initialValue?.id;
  notificationMessage.description =
    options?.initialValue?.description ??
    `Fake notification message ${faker.string.alpha({ length: 10 })}`;
  notificationMessage.templateId =
    options?.initialValue?.templateId ?? faker.string.uuid();
  notificationMessage.emailContacts = options?.initialValue?.emailContacts;
  return notificationMessage;
}

/**
 * Persists a fake notification message to be used in isolation by a test. A
 * negative id is assigned so the created message does not collide with the
 * notification messages seeded by the database seeder, keeping the test isolated
 * from the seeded data.
 * @param dataSource data source to persist the notification message.
 * @param options notification message options.
 * - `initialValue` notification message initial values.
 * @returns persisted notification message.
 */
export async function saveFakeNotificationMessage(
  dataSource: DataSource,
  options?: {
    initialValue?: Partial<NotificationMessage>;
  },
): Promise<NotificationMessage> {
  const notificationMessageRepo = dataSource.getRepository(NotificationMessage);
  const notificationMessage = createFakeNotificationMessage(options);
  // Assign a negative id, decreasing from the current minimum id, so the created
  // message never collides with the notification messages seeded by the database
  // seeder, keeping the test isolated from the seeded data.
  const currentMinId = await notificationMessageRepo
    .createQueryBuilder("notificationMessage")
    .select("MIN(notificationMessage.id)", "min")
    .getRawOne<{ min: number }>();
  notificationMessage.id = Math.min(currentMinId.min, 0) - 1;
  return notificationMessageRepo.save(notificationMessage);
}
