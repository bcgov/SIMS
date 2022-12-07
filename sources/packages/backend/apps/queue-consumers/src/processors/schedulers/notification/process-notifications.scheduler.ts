import { InjectQueue, Process, Processor } from "@nestjs/bull";
import Bull, { Job, Queue } from "bull";
import { QueueNames } from "@sims/services/queue";
import { NotificationService } from "@sims/services/notifications";
import {
  ProcessNotificationsQueueInDTO,
  ProcessNotificationsResponseQueueOutDTO,
} from "./models/notification.dto";
import { BaseScheduler } from "../base-scheduler";
import {
  PROCESS_NOTIFICATIONS_POLLING_LIMIT,
  PROCESS_NOTIFICATION_CLEANUP_PERIOD,
} from "@sims/services/constants";

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
    return { pollingLimit: PROCESS_NOTIFICATIONS_POLLING_LIMIT };
  }

  @Process()
  async sendEmailNotification(
    job: Job<ProcessNotificationsQueueInDTO>,
  ): Promise<ProcessNotificationsResponseQueueOutDTO> {
    const processNotificationResponse =
      await this.notificationService.processUnsentNotifications(
        job.data.pollingLimit,
      );
    this.schedulerQueue.clean(PROCESS_NOTIFICATION_CLEANUP_PERIOD, "completed");
    return processNotificationResponse;
  }
}
