import { InjectQueue, Processor } from "@nestjs/bull";
import { Job, Queue } from "bull";
import { NotificationService } from "@sims/services/notifications";
import { ProcessNotificationsQueueInDTO } from "./models/notification.dto";
import { BaseScheduler } from "../base-scheduler";
import { QueueNames } from "@sims/utilities";
import { QueueService } from "@sims/services/queue";
import { LoggerService, ProcessSummary } from "@sims/utilities/logger";

const DEFAULT_POLLING_RECORDS_LIMIT = 1000;
const DEFAULT_EXTERNAL_RATE_LIMIT = 490;
const DEFAULT_EXTERNAL_RATE_LIMIT_SECONDS = 60;

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
    logger: LoggerService,
  ) {
    super(schedulerQueue, queueService, logger);
  }

  protected async payload(): Promise<ProcessNotificationsQueueInDTO> {
    const queueConfigurationDetails =
      await this.queueService.queueConfigurationDetails(
        this.schedulerQueue.name as QueueNames,
      );
    const config = queueConfigurationDetails.queueConfiguration;
    return {
      pollingRecordsLimit:
        config.pollingRecordLimit ?? DEFAULT_POLLING_RECORDS_LIMIT,
      externalRateLimit:
        config.externalRateLimit ?? DEFAULT_EXTERNAL_RATE_LIMIT,
      externalRateLimitSeconds:
        config.externalRateLimitSeconds ?? DEFAULT_EXTERNAL_RATE_LIMIT_SECONDS,
    };
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
  ): Promise<string[]> {
    const processNotificationResponse =
      await this.notificationService.processUnsentNotifications(
        job.data.pollingRecordsLimit,
        job.data.externalRateLimit,
        job.data.externalRateLimitSeconds,
      );
    if (
      processNotificationResponse.notificationsProcessed !==
      processNotificationResponse.notificationsSuccessfullyProcessed
    ) {
      processSummary.warn(
        "Not all pending notifications were successfully processed.",
      );
    }
    const processedLogResult = [
      `Total notifications processed ${processNotificationResponse.notificationsProcessed}.`,
      `Total notifications successfully processed ${processNotificationResponse.notificationsSuccessfullyProcessed}.`,
    ];
    processedLogResult.forEach((log) => processSummary.info(log));
    return processedLogResult;
  }
}
