import { Processor } from "@nestjs/bullmq";
import { DisbursementReceiptProcessingService } from "@sims/integrations/esdc-integration";
import { QueueNames } from "@sims/utilities";
import { Job } from "bullmq";
import { BaseQueueProcessor } from "../../base-queue-processor";
import { LoggerService, ProcessSummary } from "@sims/utilities/logger";

@Processor(
  QueueNames.DisbursementReceiptsFileIntegration,
  BaseQueueProcessor.defaultWorkerOptions,
)
export class DisbursementReceiptsFileIntegrationScheduler extends BaseQueueProcessor<void> {
  constructor(
    private readonly disbursementReceiptProcessingService: DisbursementReceiptProcessingService,
    logger: LoggerService,
  ) {
    super(logger);
  }

  /**
   * Process all the disbursement receipt files from remote SFTP location.
   * @param _job process job.
   * @param processSummary process summary for logging.
   * @returns processing result.
   */
  protected async processQueue(
    _job: Job<void>,
    processSummary: ProcessSummary,
  ): Promise<string> {
    await this.disbursementReceiptProcessingService.process(processSummary);
    return "Completed disbursement receipts integration.";
  }
}
