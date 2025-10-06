import { InjectQueue, Processor } from "@nestjs/bull";
import { QueueService } from "@sims/services/queue";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../base-scheduler";
import { ProcessSummary } from "@sims/utilities/logger";
import { QueueNames } from "@sims/utilities";
import { StudentApplicationNotificationService } from "../../../services";

@Processor(QueueNames.StudentApplicationNotifications)
export class StudentApplicationNotificationsScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.StudentApplicationNotifications)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly studentApplicationNotificationService: StudentApplicationNotificationService,
  ) {
    super(schedulerQueue, queueService);
    this.logger.setContext(StudentApplicationNotificationsScheduler.name);
  }

  /**
   * Process student application notifications.
   * @param _job process job.
   * @param processSummary process summary for logging.
   * @returns processing result.
   */
  protected async process(
    _job: Job<void>,
    processSummary: ProcessSummary,
  ): Promise<string> {
    await this.studentApplicationNotificationService.notifyStudentApplication(
      processSummary,
    );
    return "Process finalized with success.";
  }
}
