import { Global, Module } from "@nestjs/common";
import { NotificationMessageService } from "./notification-message/notification-message.service";
import { NotificationActionsService } from "./notification/notification-actions.service";
import { GCNotifyService } from "./notification/gc-notify.service";
import { NotificationService } from "./notification/notification.service";

@Global()
@Module({
  providers: [
    GCNotifyService,
    NotificationActionsService,
    NotificationService,
    NotificationMessageService,
  ],
  exports: [NotificationActionsService],
})
export class NotificationsModule {}
