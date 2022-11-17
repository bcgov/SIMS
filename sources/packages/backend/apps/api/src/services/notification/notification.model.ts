import { NotificationMessageType } from "@sims/sims-db";

export interface SaveNotificationModel {
  userId?: number;
  messageType: NotificationMessageType;
  messagePayload: unknown;
}
