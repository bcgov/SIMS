import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { QueueService } from "@sims/services/queue";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../../base-scheduler";
import {
  InjectLogger,
  LoggerService,
  ProcessSummary,
} from "@sims/utilities/logger";
import {
  getSuccessMessageWithAttentionCheck,
  logProcessSummaryToJobLogger,
} from "../../../../utilities";
import { QueueNames } from "@sims/utilities";

@Processor(QueueNames.ApplicationChangesReportIntegration)
export class ApplicationChangesReportIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.ApplicationChangesReportIntegration)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
  ) {
    super(schedulerQueue, queueService);
  }

  /**
   * Generate application changes report for the applications which has at least one e-Cert sent
   * and the application study dates have changed after the first e-Cert
   * or after the last time the application was reported for study dates change
   * through application changes report.
   * @param job job.
   * @returns process summary.
   */
  @Process()
  async generateApplicationChangesReport(job: Job<void>): Promise<string[]> {
    const processSummary = new ProcessSummary();

    try {
      this.logger.log(
        `Processing application changes report integration job. Job id: ${job.id} and Job name: ${job.name}.`,
      );
      // TODO: Processing implementation of application changes report.
      return getSuccessMessageWithAttentionCheck(
        ["Process finalized with success."],
        processSummary,
      );
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
