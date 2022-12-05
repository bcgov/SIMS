import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import {
  QueueNames,
  SendEmailNotificationQueueInDTO,
} from "@sims/services/queue";
import {
  GCNotifyResult,
  NotificationService,
} from "@sims/services/notifications";

/**
 * Process messages sent to send email notification.
 */
@Processor(QueueNames.SendEmailNotification)
export class SendEmailNotificationProcessor {
  constructor(private readonly notificationService: NotificationService) {}

  @Process()
  async sendEmailNotification(
    job: Job<SendEmailNotificationQueueInDTO>,
  ): Promise<GCNotifyResult> {
    return await this.notificationService.sendEmailNotification(
      job.data.notificationId,
    );
  }
}
