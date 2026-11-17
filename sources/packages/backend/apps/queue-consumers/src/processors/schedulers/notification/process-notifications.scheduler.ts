import { Processor } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { NotificationService } from "@sims/services/notifications";
import { ProcessNotificationsQueueInDTO } from "./models/notification.dto";
import { BaseQueueProcessor } from "../base-queue-processor";
import { QueueNames } from "@sims/utilities";
import { LoggerService, ProcessSummary } from "@sims/utilities/logger";

const DEFAULT_POLLING_RECORDS_LIMIT = 100;
const DEFAULT_EXTERNAL_RATE_LIMIT = 490;
const DEFAULT_EXTERNAL_RATE_LIMIT_SECONDS = 60;

/**
 * Process notifications which are unsent.
 */
@Processor(
  QueueNames.ProcessNotifications,
  BaseQueueProcessor.defaultWorkerOptions,
)
export class ProcessNotificationScheduler extends BaseQueueProcessor<ProcessNotificationsQueueInDTO> {
  constructor(
    private readonly notificationService: NotificationService,
    logger: LoggerService,
  ) {
    super(logger);
  }

  /**
   * Process all the unsent notifications and return
   * summary of processing.
   * @param job process job.
   * @param processSummary process summary for logging.
   * @returns processing summary.
   */
  protected async processQueue(
    job: Job<ProcessNotificationsQueueInDTO>,
    processSummary: ProcessSummary,
  ): Promise<string[]> {
    const processNotificationResponse =
      await this.notificationService.processUnsentNotifications(
        job.data.pollingRecordsLimit ?? DEFAULT_POLLING_RECORDS_LIMIT,
        job.data.externalRateLimit ?? DEFAULT_EXTERNAL_RATE_LIMIT,
        job.data.externalRateLimitSeconds ??
          DEFAULT_EXTERNAL_RATE_LIMIT_SECONDS,
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
