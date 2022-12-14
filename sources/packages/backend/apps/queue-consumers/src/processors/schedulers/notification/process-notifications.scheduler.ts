import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { Job, Queue } from "bull";
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
import { QueueNames } from "@sims/utilities";

/**
 * Process notifications which are unsent.
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
   * TODO:This method will be removed in next PR of #1551.
   * @returns cron expression.
   */
  protected get cronExpression(): string {
    return "* * * * *";
  }

  protected get payload(): ProcessNotificationsQueueInDTO {
    return { pollingRecordsLimit: PROCESS_NOTIFICATIONS_POLLING_LIMIT };
  }

  /**
   * Process all the unsent notifications and return
   * summary of processing.
   * @param job process notification job.
   * @returns processing summary.
   */
  @Process()
  async processNotifications(
    job: Job<ProcessNotificationsQueueInDTO>,
  ): Promise<ProcessNotificationsResponseQueueOutDTO> {
    const processNotificationResponse =
      await this.notificationService.processUnsentNotifications(
        job.data.pollingRecordsLimit,
      );
    await this.schedulerQueue.clean(
      PROCESS_NOTIFICATION_CLEANUP_PERIOD,
      "completed",
    );
    return processNotificationResponse;
  }
}
