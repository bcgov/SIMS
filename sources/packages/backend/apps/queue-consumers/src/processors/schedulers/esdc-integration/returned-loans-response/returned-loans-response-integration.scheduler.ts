import { Processor } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { LoggerService, ProcessSummary } from "@sims/utilities/logger";
import { QueueNames } from "@sims/utilities";
import { ReturnedLoansResponseProcessingService } from "@sims/integrations/esdc-integration";
import { BaseQueueProcessor } from "../../base-queue-processor";

/**
 * Scheduler to process Return to Government(RTG) files.
 ** Both OTH (270 days file) and PDD (Death, Permanent Disability file) RTG files are processed by this scheduler.
 */
@Processor(QueueNames.ReturnedLoansResponseIntegration)
export class ReturnedLoansResponseIntegrationScheduler extends BaseQueueProcessor<void> {
  constructor(
    private readonly returnedLoansResponseProcessingService: ReturnedLoansResponseProcessingService,
    logger: LoggerService,
  ) {
    super(QueueNames.ReturnedLoansResponseIntegration, logger);
  }

  /**
   * Process the returned loans response file(s).
   * @param _job process job.
   * @param processSummary process summary for logging.
   * @returns process summary.
   */
  protected async processQueue(
    _job: Job<void>,
    processSummary: ProcessSummary,
  ): Promise<string[]> {
    const processingResponse =
      await this.returnedLoansResponseProcessingService.process(processSummary);
    return [
      "Process finalized with success.",
      `Received files: ${processingResponse.receivedFiles}.`,
    ];
  }
}
