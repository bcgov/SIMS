import {
  Notification,
  NotificationMessage,
  NotificationMessageType,
  User,
} from "@sims/sims-db";
import { DataSource } from "typeorm";
import { createFakeUser } from "./user";
import * as faker from "faker";

/**
 * Email message format.
 */
interface NotificationEmailMessage {
  template_id: string;
  email_address: string;
  personalisation?: {
    [key: string]:
      | string
      | number
      | {
          file: string;
          filename: string;
          sending_method: "attach" | "link";
        };
  };
}

/**
 * Creates a fake message payload.
 * @returns created message payload.
 */
function createDummyMessagePayload(): NotificationEmailMessage {
  return {
    email_address: faker.internet.email(),
    template_id: NotificationMessageType.StudentFileUpload.toString(),
    personalisation: {
      givenNames: faker.name.firstName(),
      lastName: faker.name.lastName(),
    },
  };
}

/**
 *
 * @param relations notification entity relations.
 * - `user` related user.
 * - `creator` related creator.
 * - `notificationMessage` related notification message.
 * @param options notification options.
 * - `initialValue` notification initial values.
 * @returns created notification.
 */
function createFakeNotification(
  relations?: {
    user?: User;
    creator?: User;
    notificationMessage?: NotificationMessage;
  },
  options?: {
    initialValue?: Partial<Notification>;
  },
): Notification {
  const notification = new Notification();
  notification.user = relations.user ?? createFakeUser();
  notification.notificationMessage =
    relations?.notificationMessage ??
    ({
      id: NotificationMessageType.StudentFileUpload,
    } as NotificationMessage);
  notification.metadata = options?.initialValue?.metadata ?? null;
  notification.messagePayload =
    options?.initialValue?.messagePayload ?? createDummyMessagePayload();
  notification.creator = relations?.creator ?? null;
  notification.createdAt = options?.initialValue?.createdAt;
  return notification;
}

/**
 * Create and save fake student.
 * @param dataSource data source to persist the notification.
 * @param relations notification entity relations.
 * - `notification` notification to be created and associated with other relations.
 * - `notificationMessage` related notification message.
 * - `user` related user.
 * - `creator` related creator.
 * @param options notification options.
 * - `initialValue` notification initial values.
 * @returns persisted notification.
 */
export async function saveFakeNotification(
  dataSource: DataSource,
  relations?: {
    notification?: Notification;
    notificationMessage?: NotificationMessage;
    user?: User;
    creator?: User;
  },
  options?: {
    initialValue?: Partial<Notification>;
  },
): Promise<Notification> {
  const notificationRepo = dataSource.getRepository(Notification);
  return notificationRepo.save(
    relations?.notification ??
      createFakeNotification(
        {
          user: relations?.user,
          creator: relations?.creator,
          notificationMessage: relations?.notificationMessage,
        },
        { initialValue: options?.initialValue },
      ),
  );
}
