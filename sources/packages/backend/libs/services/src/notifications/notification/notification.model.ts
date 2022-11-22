import { NotificationMessageType } from "@sims/sims-db";

export interface SaveNotificationModel {
  userId?: number;
  messageType: NotificationMessageType;
  messagePayload: {
    email_address: string;
    template_id: string;
  };
}
