import { Processor } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { BaseQueueProcessor } from "../base-queue-processor";
import { LoggerService, ProcessSummary } from "@sims/utilities/logger";
import { QueueNames } from "@sims/utilities";
import { StudentApplicationNotificationService } from "../../../services";

@Processor(
  QueueNames.StudentApplicationNotifications,
  BaseQueueProcessor.defaultWorkerOptions,
)
export class StudentApplicationNotificationsScheduler extends BaseQueueProcessor<void> {
  constructor(
    private readonly studentApplicationNotificationService: StudentApplicationNotificationService,
    logger: LoggerService,
  ) {
    super(logger);
  }

  /**
   * Process student application notifications.
   * @param _job process job.
   * @param processSummary process summary for logging.
   * @returns processing result.
   */
  protected async processQueue(
    _job: Job<void>,
    processSummary: ProcessSummary,
  ): Promise<string> {
    await this.studentApplicationNotificationService.notifyStudentApplication(
      processSummary,
    );
    return "Process finalized with success.";
  }
}
