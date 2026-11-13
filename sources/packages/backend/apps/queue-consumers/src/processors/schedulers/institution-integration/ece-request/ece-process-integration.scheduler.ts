import { Processor } from "@nestjs/bullmq";
import { ECEProcessingService } from "@sims/integrations/institution-integration/ece-integration";
import { QueueNames } from "@sims/utilities";
import { LoggerService, ProcessSummary } from "@sims/utilities/logger";
import { Job } from "bullmq";
import { BaseQueueProcessor } from "../../base-queue-processor";

@Processor(
  QueueNames.ECEProcessIntegration,
  BaseQueueProcessor.defaultWorkerOptions,
)
export class ECEProcessIntegrationScheduler extends BaseQueueProcessor<void> {
  constructor(
    private readonly eceFileService: ECEProcessingService,
    logger: LoggerService,
  ) {
    super(logger);
  }

  /**
   * Identifies all the applications that have an eligible COE request waiting
   * for a particular institution.
   * @param _job process job.
   * @param processSummary process summary for logging.
   * @returns processing result with uploaded files, if any.
   */
  protected async processQueue(
    _job: Job<void>,
    processSummary: ProcessSummary,
  ): Promise<string[] | string> {
    const uploadResults =
      await this.eceFileService.processECEFile(processSummary);
    if (!uploadResults.length) {
      return "No eligible COEs found.";
    }
    return uploadResults.map(
      (uploadResult) =>
        `Uploaded file ${uploadResult.generatedFile}, with ${uploadResult.uploadedRecords} record(s).`,
    );
  }
}
