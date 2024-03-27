import { NotificationEmailMessage } from "@sims/services";
import {
  Notification,
  NotificationMessage,
  NotificationMessageType,
  User,
} from "@sims/sims-db";
import * as faker from "faker";

/**
 * Creates a fake message payload.
 * @returns created message payload.
 */
function createDummyMessagePayload(): NotificationEmailMessage {
  return {
    email_address: faker.internet.email(),
    template_id: faker.datatype.string(),
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
