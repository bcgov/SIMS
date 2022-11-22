import { Global, Module } from "@nestjs/common";
import { DatabaseModule } from "@sims/sims-db";
import { ConfigModule } from "@sims/utilities/config";
import { NotificationMessageService } from "./notification-message/notification-message.service";
import { NotifyActionsService } from "./notification/gc-notify-actions.service";
import { GCNotifyService } from "./notification/gc-notify.service";
import { NotificationService } from "./notification/notification.service";

@Global()
@Module({
  imports: [DatabaseModule, ConfigModule],
  providers: [
    GCNotifyService,
    NotifyActionsService,
    NotificationService,
    NotificationMessageService,
  ],
  exports: [NotifyActionsService],
})
export class NotificationsModule {}
