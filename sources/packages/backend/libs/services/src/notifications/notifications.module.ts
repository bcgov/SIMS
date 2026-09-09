import { Global, Module } from "@nestjs/common";
import { NotificationMessageService } from "./notification-message/notification-message.service";
import { NotificationActionsService } from "./notification/notification-actions.service";
import { GCNotifyService } from "./notification/gc-notify.service";
import { NotifyService } from "./notification/notify.service";
import { NotificationService } from "./notification/notification.service";
import { FeatureTogglesModule } from "../feature-toggles/feature-toggles.module";

@Global()
@Module({
  imports: [FeatureTogglesModule],
  providers: [
    NotifyService,
    GCNotifyService,
    NotificationActionsService,
    NotificationService,
    NotificationMessageService,
  ],
  exports: [
    NotificationActionsService,
    NotificationService,
    NotificationMessageService,
  ],
})
export class NotificationsModule {}
