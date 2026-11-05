import { Processor } from "@nestjs/bullmq";
import { MSFAAResponseProcessingService } from "@sims/integrations/esdc-integration";
import { OfferingIntensity } from "@sims/sims-db";
import { QueueNames } from "@sims/utilities";
import { Job } from "bullmq";
import { BaseQueueProcessor } from "../../base-queue-processor";
import { LoggerService, ProcessSummary } from "@sims/utilities/logger";

@Processor(
  QueueNames.FullTimeMSFAAProcessResponseIntegration,
  BaseQueueProcessor.defaultWorkerOptions,
)
export class FullTimeMSFAAProcessResponseIntegrationScheduler extends BaseQueueProcessor<void> {
  constructor(
    private readonly msfaaResponseService: MSFAAResponseProcessingService,
    logger: LoggerService,
  ) {
    super(logger);
  }

  /**
   * Download all fulltime files from MSFAA Response folder on SFTP and process them all.
   * @param _job process job.
   * @param processSummary process summary for logging.
   * @returns process result.
   */
  protected async processQueue(
    _job: Job<void>,
    processSummary: ProcessSummary,
  ): Promise<string> {
    await this.msfaaResponseService.processResponses(
      OfferingIntensity.fullTime,
      processSummary,
    );
    return "MSFAA full-time response files processed.";
  }
}
