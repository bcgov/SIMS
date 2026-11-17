import { Processor } from "@nestjs/bullmq";
import { SINValidationProcessingService } from "@sims/integrations/esdc-integration";
import { QueueNames } from "@sims/utilities";
import { Job } from "bullmq";
import { BaseQueueProcessor } from "../../base-queue-processor";
import { LoggerService, ProcessSummary } from "@sims/utilities/logger";

@Processor(
  QueueNames.SINValidationProcessIntegration,
  BaseQueueProcessor.defaultWorkerOptions,
)
export class SINValidationProcessIntegrationScheduler extends BaseQueueProcessor<void> {
  constructor(
    private readonly sinValidationProcessingService: SINValidationProcessingService,
    logger: LoggerService,
  ) {
    super(logger);
  }

  /**
   * Identifies all the students that still do not have their SIN
   * validated and create the validation request for ESDC processing.
   * @param _job job details.
   * @param processSummary process summary for logging.
   * @returns processing result log.
   */
  protected async processQueue(
    _job: Job<void>,
    processSummary: ProcessSummary,
  ): Promise<string[]> {
    const childProcessSummary = new ProcessSummary();
    processSummary.children(childProcessSummary);
    const uploadResult =
      await this.sinValidationProcessingService.uploadSINValidationRequests(
        childProcessSummary,
      );
    return [
      `Generated file: ${uploadResult.generatedFile}`,
      `Uploaded records: ${uploadResult.uploadedRecords}`,
    ];
  }
}
