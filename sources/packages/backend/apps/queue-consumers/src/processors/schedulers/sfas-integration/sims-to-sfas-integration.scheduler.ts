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
import { SIMSToSFASService } from "@sims/integrations/services/sfas";
import { SIMS_TO_SFAS_BRIDGE_FILE_INITIAL_DATE } from "@sims/integrations/constants";

@Processor(QueueNames.SIMSToSFASIntegration)
export class SIMSToSFASIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.SIMSToSFASIntegration)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly simsToSFASService: SIMSToSFASService,
    private readonly simsToSFASIntegrationProcessingService: SIMSToSFASProcessingService,
  ) {
    super(schedulerQueue, queueService);
  }

  /**
   * Generate data file consisting of all student, application and restriction updates in SIMS since the previous file generation
   * until the start of the current job and send the data file to SFAS.
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
      // Set the bridge data extracted date as current date-time
      // before staring to process the bridge data.
      const bridgeDataExtractedDate = new Date();
      const latestBridgeFileReferenceDate =
        await this.simsToSFASService.getLatestBridgeFileLogDate();
      // If the bridge is being executed for the first time, set the modified since date to
      // a safe initial date.
      const modifiedSince =
        latestBridgeFileReferenceDate ?? SIMS_TO_SFAS_BRIDGE_FILE_INITIAL_DATE;
      processSummary.info(
        `Processing data since ${modifiedSince} until ${bridgeDataExtractedDate}.`,
      );
      const integrationProcessSummary = new ProcessSummary();
      processSummary.children(integrationProcessSummary);
      const { studentRecordsSent, uploadedFileName } =
        await this.simsToSFASIntegrationProcessingService.processSIMSUpdates(
          integrationProcessSummary,
          modifiedSince,
          bridgeDataExtractedDate,
        );
      processSummary.info("Processing SIMS to SFAS integration job completed.");
      return getSuccessMessageWithAttentionCheck(
        [
          "Process finalized with success.",
          `Student records sent: ${studentRecordsSent}.`,
          `Uploaded file name: ${uploadedFileName}.`,
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
