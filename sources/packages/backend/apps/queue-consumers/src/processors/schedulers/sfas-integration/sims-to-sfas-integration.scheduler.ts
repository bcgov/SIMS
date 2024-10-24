import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { QueueService } from "@sims/services/queue";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../base-scheduler";
import {
  InjectLogger,
  LoggerService,
  ProcessSummary,
} from "@sims/utilities/logger";
import {
  getSuccessMessageWithAttentionCheck,
  logProcessSummaryToJobLogger,
} from "../../../utilities";
import { QueueNames } from "@sims/utilities";
import { SIMSToSFASProcessingService } from "@sims/integrations/sfas-integration";

@Processor(QueueNames.SIMSToSFASIntegration)
export class SIMSToSFASIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.SIMSToSFASIntegration)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly simsToSFASIntegrationProcessingService: SIMSToSFASProcessingService,
  ) {
    super(schedulerQueue, queueService);
  }

  /**
   * Generate data file consisting of all student, application and restriction updates in SIMS since the previous file generation
   * and send the data file to SFAS.
   * @param job job.
   * @returns process summary.
   */
  @Process()
  async generateSFASBridgeFile(job: Job<void>): Promise<string[]> {
    const processSummary = new ProcessSummary();

    try {
      processSummary.info(
        `Processing SIMS to SFAS integration job. Job id: ${job.id} and Job name: ${job.name}.`,
      );
      const integrationProcessSummary = new ProcessSummary();
      processSummary.children(integrationProcessSummary);
      const { studentRecordsSent, uploadedFileName } =
        await this.simsToSFASIntegrationProcessingService.processSIMSUpdates(
          integrationProcessSummary,
        );
      processSummary.info("Processing SIMS to SFAS integration job completed.");
      return getSuccessMessageWithAttentionCheck(
        [
          "Process finalized with success.",
          `Student records sent: ${studentRecordsSent}`,
          `Uploaded file name: ${uploadedFileName}`,
        ],
        processSummary,
      );
    } catch (error: unknown) {
      const errorMessage =
        "Unexpected error while executing the SIMS to SFAS integration job.";
      processSummary.error(errorMessage, error);
      throw new Error(errorMessage, { cause: error });
    } finally {
      this.logger.logProcessSummary(processSummary);
      await logProcessSummaryToJobLogger(processSummary, job);
      await this.cleanSchedulerQueueHistory();
    }
  }

  @InjectLogger()
  logger: LoggerService;
}
