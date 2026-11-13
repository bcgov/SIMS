import { Processor } from "@nestjs/bullmq";
import { SINValidationProcessingService } from "@sims/integrations/esdc-integration";
import { QueueNames } from "@sims/utilities";
import { Job } from "bullmq";
import { BaseQueueProcessor } from "../../base-queue-processor";
import { LoggerService, ProcessSummary } from "@sims/utilities/logger";

@Processor(
  QueueNames.SINValidationResponseIntegration,
  BaseQueueProcessor.defaultWorkerOptions,
)
export class SINValidationResponseIntegrationScheduler extends BaseQueueProcessor<void> {
  constructor(
    private readonly sinValidationProcessingService: SINValidationProcessingService,
    logger: LoggerService,
  ) {
    super(logger);
  }

  /**
   * Download all SIN validation files from ESDC response folder on SFTP and process them all.
   * @param _job process job.
   * @param processSummary process summary for logging.
   * @returns summary with what was processed and the list of all errors, if any.
   */
  protected async processQueue(
    _job: Job<void>,
    processSummary: ProcessSummary,
  ): Promise<string> {
    const childProcessSummary = new ProcessSummary();
    processSummary.children(childProcessSummary);
    await this.sinValidationProcessingService.processResponses(
      childProcessSummary,
    );
    return "ESDC SIN validation response files processed.";
  }
}
