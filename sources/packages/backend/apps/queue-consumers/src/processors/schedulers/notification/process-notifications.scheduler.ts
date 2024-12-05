import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { Job, Queue } from "bull";
import { NotificationService } from "@sims/services/notifications";
import { ProcessNotificationsQueueInDTO } from "./models/notification.dto";
import { BaseScheduler } from "../base-scheduler";
import { QueueNames } from "@sims/utilities";
import { QueueService } from "@sims/services/queue";
import { QueueProcessSummaryResult } from "../../models/processors.models";
import { ProcessSummary } from "@sims/utilities/logger";

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

  processQueue(
    job: Job<ProcessNotificationsQueueInDTO>,
  ): Promise<string | string[]> {
    throw new Error("Method not implemented.");
  }

  async process(
    _job: Job<ProcessNotificationsQueueInDTO>,
    _processSummary: ProcessSummary,
  ): Promise<string | string[]> {
    throw new Error("Method not implemented.");
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
   * @param job process notification job.
   * @returns processing summary.
   */
  @Process()
  async processNotifications(
    job: Job<ProcessNotificationsQueueInDTO>,
  ): Promise<QueueProcessSummaryResult> {
    const processNotificationResponse =
      await this.notificationService.processUnsentNotifications(
        job.data.pollingRecordsLimit,
      );
    const processSummaryResult: string[] = [
      `Total notifications processed ${processNotificationResponse.notificationsProcessed}`,
      `Total notifications successfully processed ${processNotificationResponse.notificationsSuccessfullyProcessed}`,
    ];
    return { summary: processSummaryResult } as QueueProcessSummaryResult;
  }
}
