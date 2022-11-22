import { Global, Module } from "@nestjs/common";
import { NotificationMessageService } from "./notification-message/notification-message.service";
import { NotifyActionsService } from "./notification/gc-notify-actions.service";
import { GCNotifyService } from "./notification/gc-notify.service";
import { NotificationService } from "./notification/notification.service";

@Global()
@Module({
  providers: [
    GCNotifyService,
    NotifyActionsService,
    NotificationService,
    NotificationMessageService,
  ],
  exports: [NotifyActionsService],
})
export class NotificationsModule {}
