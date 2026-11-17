import { Processor } from "@nestjs/bullmq";
import { PartTimeECertFileHandler } from "@sims/integrations/esdc-integration";
import { QueueNames } from "@sims/utilities";
import { Job } from "bullmq";
import { BaseQueueProcessor } from "../../base-queue-processor";
import { LoggerService, ProcessSummary } from "@sims/utilities/logger";

@Processor(
  QueueNames.PartTimeFeedbackIntegration,
  BaseQueueProcessor.defaultWorkerOptions,
)
export class PartTimeECertFeedbackIntegrationScheduler extends BaseQueueProcessor<void> {
  constructor(
    private readonly partTimeECertFileHandler: PartTimeECertFileHandler,
    logger: LoggerService,
  ) {
    super(logger);
  }

  /**
   * Download all files from Part Time E-Cert Response folder on SFTP and process them all.
   * @param _job process job.
   * @param processSummary process summary for logging.
   * @returns processing results.
   */
  protected async processQueue(
    _job: Job<void>,
    processSummary: ProcessSummary,
  ): Promise<string> {
    await this.partTimeECertFileHandler.processECertResponses(processSummary);
    return "Process finalized with success.";
  }
}
