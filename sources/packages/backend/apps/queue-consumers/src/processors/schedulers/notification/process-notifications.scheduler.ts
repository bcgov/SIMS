import { InjectQueue, Processor } from "@nestjs/bull";
import { Job, Queue } from "bull";
import { NotificationService } from "@sims/services/notifications";
import { ProcessNotificationsQueueInDTO } from "./models/notification.dto";
import { BaseScheduler } from "../base-scheduler";
import { QueueNames } from "@sims/utilities";
import { QueueService } from "@sims/services/queue";
import {
  InjectLogger,
  LoggerService,
  ProcessSummary,
} from "@sims/utilities/logger";

/**
 * Process notifications which are unsent.
 */
@Processor(QueueNames.ProcessNotifications)
export class ProcessNotificationScheduler extends BaseScheduler<ProcessNotificationsQueueInDTO> {
  constructor(
    @InjectQueue(QueueNames.ProcessNotifications)
    schedulerQueue: Queue<ProcessNotificationsQueueInDTO>,
    private readonly notificationService: NotificationService,
    queueService: QueueService,
  ) {
    super(schedulerQueue, queueService);
  }

  protected async payload(): Promise<ProcessNotificationsQueueInDTO> {
    const queuePollingRecordsLimit =
      await this.queueService.getQueuePollingRecordLimit(
        this.schedulerQueue.name as QueueNames,
      );
    return { pollingRecordsLimit: queuePollingRecordsLimit };
  }

  /**
   * Process all the unsent notifications and return
   * summary of processing.
   * @param job process job.
   * @param processSummary process summary for logging.
   * @returns processing summary.
   */
  protected async process(
    job: Job<ProcessNotificationsQueueInDTO>,
    processSummary: ProcessSummary,
  ): Promise<string> {
    const processNotificationResponse =
      await this.notificationService.processUnsentNotifications(
        job.data.pollingRecordsLimit,
      );
    processSummary.info(
      `Total notifications processed ${processNotificationResponse.notificationsProcessed}.`,
    );
    processSummary.info(
      `Total notifications successfully processed ${processNotificationResponse.notificationsSuccessfullyProcessed}.`,
    );
    if (
      processNotificationResponse.notificationsProcessed !==
      processNotificationResponse.notificationsSuccessfullyProcessed
    ) {
      processSummary.warn(
        "Not all pending notifications were successfully processed.",
      );
    }
    return "Notifications processed.";
  }

  /**
   * Setting the logger here allows the correct context to be set
   * during the property injection.
   * Even if the logger is not used, it is required to be set, to
   * allow the base classes to write logs using the correct context.
   */
  @InjectLogger()
  logger: LoggerService;
}
