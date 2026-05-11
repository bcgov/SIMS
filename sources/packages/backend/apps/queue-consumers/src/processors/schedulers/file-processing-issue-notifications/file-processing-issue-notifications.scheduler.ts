import { InjectQueue, Processor } from "@nestjs/bull";
import { QueueService } from "@sims/services/queue";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../base-scheduler";
import { LoggerService, ProcessSummary } from "@sims/utilities/logger";
import { QueueNames } from "@sims/utilities";
import { FileProcessingIssueNotificationService } from "apps/queue-consumers/src/services/file-processing-issue-notification/file-process-issue-notification.service";

@Processor(QueueNames.FileProcessingIssueNotifications)
export class FileProcessingIssueNotificationsScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.FileProcessingIssueNotifications)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly fileProcessingIssueNotificationService: FileProcessingIssueNotificationService,
    logger: LoggerService,
  ) {
    super(schedulerQueue, queueService, logger);
  }

  /**
   * Process file processing issue notifications.
   * @param _job process job.
   * @param processSummary process summary for logging.
   * @returns processing result.
   */
  protected async process(
    _job: Job<void>,
    processSummary: ProcessSummary,
  ): Promise<string> {
    await this.fileProcessingIssueNotificationService.notifyFileProcessingIssues();

    console.log("process summary", processSummary);

    return "Completed processing file processing issue notifications.";
  }
}
