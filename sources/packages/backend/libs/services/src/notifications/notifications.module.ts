import { Global, Module } from "@nestjs/common";
import { NotificationMessageService } from "./notification-message/notification-message.service";
import { NotificationActionsService } from "./notification/notification-actions.service";
import { GCNotifyService } from "./notification/gc-notify.service";
import { NotificationService } from "./notification/notification.service";
import { HttpModule } from "@nestjs/axios";

@Global()
@Module({
  imports: [HttpModule],
  providers: [
    GCNotifyService,
    NotificationActionsService,
    NotificationService,
    NotificationMessageService,
  ],
  exports: [NotificationActionsService, NotificationService],
})
export class NotificationsModule {}
