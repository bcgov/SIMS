import { Processor } from "@nestjs/bullmq";
import { FullTimeECertFileHandler } from "@sims/integrations/esdc-integration";
import { QueueNames } from "@sims/utilities";
import { Job } from "bullmq";
import { BaseQueueProcessor } from "../../base-queue-processor";
import { LoggerService, ProcessSummary } from "@sims/utilities/logger";

@Processor(
  QueueNames.FullTimeFeedbackIntegration,
  BaseQueueProcessor.defaultWorkerOptions,
)
export class FullTimeECertFeedbackIntegrationScheduler extends BaseQueueProcessor<void> {
  constructor(
    private readonly fullTimeECertFileHandler: FullTimeECertFileHandler,
    logger: LoggerService,
  ) {
    super(logger);
  }

  /**
   * Download all files from FullTime E-Cert Response folder on SFTP and process them all.
   * @param _job process job.
   * @param processSummary process summary for logging.
   * @returns processing results.
   */
  protected async processQueue(
    _job: Job<void>,
    processSummary: ProcessSummary,
  ): Promise<string> {
    await this.fullTimeECertFileHandler.processECertResponses(processSummary);
    return "Process finalized with success.";
  }
}
