import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { PartTimeECertFileHandler } from "@sims/integrations/esdc-integration";
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

@Processor(QueueNames.PartTimeFeedbackIntegration)
export class PartTimeECertFeedbackIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.PartTimeFeedbackIntegration)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly partTimeECertFileHandler: PartTimeECertFileHandler,
  ) {
    super(schedulerQueue, queueService);
  }

  /**
   * To be removed once the method {@link process} is implemented.
   * This method "hides" the {@link Process} decorator from the base class.
   */
  async processQueue(): Promise<string | string[]> {
    throw new Error("Method not implemented.");
  }

  /**
   * When implemented in a derived class, process the queue job.
   * To be implemented.
   */
  protected async process(): Promise<string | string[]> {
    throw new Error("Method not implemented.");
  }

  /**
   * Download all files from Part Time E-Cert Response folder on SFTP and process them all.
   * @params job job details.
   * @returns processing results.
   */
  @Process()
  async processPartTimeResponses(job: Job<void>): Promise<string[]> {
    const processSummary = new ProcessSummary();
    processSummary.info(
      `Processing e-Cert part-time feedback integration job.`,
    );
    try {
      await this.partTimeECertFileHandler.processECertResponses(processSummary);
      processSummary.info(
        `Completed e-Cert part-time feedback integration job.`,
      );
      return getSuccessMessageWithAttentionCheck(
        ["Process finalized with success."],
        processSummary,
      );
    } catch (error: unknown) {
      const errorMessage =
        "Unexpected error while executing the e-Cert part-time feedback integration job.";
      processSummary.error(errorMessage, error);
      return [errorMessage];
    } finally {
      this.logger.logProcessSummary(processSummary);
      await logProcessSummaryToJobLogger(processSummary, job);
    }
  }

  @InjectLogger()
  logger: LoggerService;
}
