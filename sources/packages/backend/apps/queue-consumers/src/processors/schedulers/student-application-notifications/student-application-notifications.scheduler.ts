import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { QueueService } from "@sims/services/queue";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../base-scheduler";
import {
  InjectLogger,
  LoggerService,
  ProcessSummary,
} from "@sims/utilities/logger";
import { logProcessSummaryToJobLogger } from "../../../utilities";
import { QueueNames } from "@sims/utilities";
import { ApplicationService } from "../../../services";
import { NotificationService } from "@sims/services/notifications";

@Processor(QueueNames.StudentApplicationNotifications)
export class StudentApplicationNotificationsScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.StudentApplicationNotifications)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly applicationService: ApplicationService,
    private readonly notificationService: NotificationService,
  ) {
    super(schedulerQueue, queueService);
  }

  @Process()
  async StudentApplicationNotifications(job: Job<void>): Promise<string[]> {
    const processSummary = new ProcessSummary();

    try {
      // TODO: Get applications that have a disability status mismatch  and check PDPPD status
    } catch (error: unknown) {
      const errorMessage = "Unexpected error while executing the job.";
      processSummary.error(errorMessage, error);
      return [errorMessage];
    } finally {
      this.logger.logProcessSummary(processSummary);
      await logProcessSummaryToJobLogger(processSummary, job);
      await this.cleanSchedulerQueueHistory();
    }
  }

  @InjectLogger()
  logger: LoggerService;
}
