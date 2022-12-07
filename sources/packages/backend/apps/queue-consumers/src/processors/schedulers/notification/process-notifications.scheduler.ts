import { InjectQueue, Process, Processor } from "@nestjs/bull";
import Bull, { Job, Queue } from "bull";
import { QueueNames } from "@sims/services/queue";
import { NotificationService } from "@sims/services/notifications";
import {
  ProcessNotificationsQueueInDTO,
  ProcessNotificationsResponseQueueOutDTO,
} from "./models/notification.dto";
import { BaseScheduler } from "../base-scheduler";

/**
 * Process messages sent to send email notification.
 */
@Processor(QueueNames.ProcessNotifications)
export class ProcessNotificationScheduler extends BaseScheduler<ProcessNotificationsQueueInDTO> {
  constructor(
    @InjectQueue(QueueNames.ProcessNotifications)
    protected readonly schedulerQueue: Queue<ProcessNotificationsQueueInDTO>,
    private readonly notificationService: NotificationService,
  ) {
    super(schedulerQueue);
  }

  /**
   * Queue configuration for the scheduler.
   * TODO: Change the hardcoded value to be assigned from db.
   */
  protected get queueConfiguration(): Bull.JobOptions {
    return {
      repeat: {
        cron: "* * * * *",
      },
    };
  }

  protected get payload(): ProcessNotificationsQueueInDTO {
    return { pollingLimit: 100 };
  }

  @Process()
  async sendEmailNotification(
    job: Job<ProcessNotificationsQueueInDTO>,
  ): Promise<ProcessNotificationsResponseQueueOutDTO> {
    return await this.notificationService.processUnsentNotifications(
      job.data.pollingLimit,
    );
  }
}
