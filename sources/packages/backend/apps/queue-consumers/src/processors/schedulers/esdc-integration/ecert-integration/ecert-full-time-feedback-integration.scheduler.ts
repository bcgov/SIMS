import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { FullTimeECertFileHandler } from "@sims/integrations/esdc-integration";
import { QueueService } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
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

@Processor(QueueNames.FullTimeFeedbackIntegration)
export class FullTimeECertFeedbackIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.FullTimeFeedbackIntegration)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly fullTimeECertFileHandler: FullTimeECertFileHandler,
  ) {
    super(schedulerQueue, queueService);
  }

  /**
   * Download all files from FullTime E-Cert Response folder on SFTP and process them all.
   * @params job job details.
   * @returns Summary with what was processed and the list of all errors, if any.
   */
  @Process()
  async processFullTimeResponses(job: Job<void>): Promise<string[]> {
    const processSummary = new ProcessSummary();
    processSummary.info(
      "Processing e-Cert full-time feedback integration job.",
    );
    try {
      await this.fullTimeECertFileHandler.processECertResponses(processSummary);
      processSummary.info("Completed E-Cert Full-time integration job.");
      return getSuccessMessageWithAttentionCheck(
        ["Process finalized with success."],
        processSummary,
      );
    } catch (error: unknown) {
      const errorMessage =
        "Unexpected error while executing the e-Cert full-time feedback integration job.";
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
