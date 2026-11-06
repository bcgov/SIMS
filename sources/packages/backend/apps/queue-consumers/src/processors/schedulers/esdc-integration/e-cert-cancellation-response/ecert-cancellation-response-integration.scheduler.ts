import { Processor } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { BaseQueueProcessor } from "../../base-queue-processor";
import { LoggerService, ProcessSummary } from "@sims/utilities/logger";
import { QueueNames } from "@sims/utilities";
import { ECertCancellationResponseProcessingService } from "@sims/integrations/esdc-integration";

@Processor(
  QueueNames.ECertCancellationResponseIntegration,
  BaseQueueProcessor.defaultWorkerOptions,
)
export class ECertCancellationResponseIntegrationScheduler extends BaseQueueProcessor<void> {
  constructor(
    private readonly eCertCancellationResponseProcessingService: ECertCancellationResponseProcessingService,
    logger: LoggerService,
  ) {
    super(logger);
  }

  /**
   * Process the e-cert cancellation file(s) and update the disbursements.
   * Both Full-time and Part-time e-Cert cancellation files are processed by this scheduler.
   * @param _job process job.
   * @param processSummary process summary for logging.
   * @returns process summary.
   */
  protected async processQueue(
    _job: Job<void>,
    processSummary: ProcessSummary,
  ): Promise<string[]> {
    const processingResponse =
      await this.eCertCancellationResponseProcessingService.process(
        processSummary,
      );

    return [
      "Process finalized with success.",
      `Received cancellation files: ${processingResponse.receivedCancellationFiles}.`,
    ];
  }
}
