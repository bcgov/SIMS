import { Processor } from "@nestjs/bullmq";
import { MSFAARequestProcessingService } from "@sims/integrations/esdc-integration";
import { MSFAA_FULL_TIME_FILE_CODE } from "@sims/services/constants";
import { OfferingIntensity } from "@sims/sims-db";
import { QueueNames } from "@sims/utilities";
import { Job } from "bullmq";
import { BaseQueueProcessor } from "../../base-queue-processor";
import { LoggerService, ProcessSummary } from "@sims/utilities/logger";

@Processor(
  QueueNames.FullTimeMSFAAIntegration,
  BaseQueueProcessor.defaultWorkerOptions,
)
export class FullTimeMSFAAProcessIntegrationScheduler extends BaseQueueProcessor<void> {
  constructor(
    private readonly msfaaRequestService: MSFAARequestProcessingService,
    logger: LoggerService,
  ) {
    super(logger);
  }

  /**
   * Identifies all the records where the MSFAA number
   * is not requested i.e. has date_requested=null
   * Create a fixed file for full time and send file
   * to the sftp server for processing.
   * @param _job process job.
   * @param processSummary process summary for logging.
   * @returns upload result.
   */
  protected async processQueue(
    _job: Job<void>,
    processSummary: ProcessSummary,
  ): Promise<string[]> {
    const result = await this.msfaaRequestService.processMSFAARequest(
      MSFAA_FULL_TIME_FILE_CODE,
      OfferingIntensity.fullTime,
      processSummary,
    );
    return [
      `Generated file: ${result.generatedFile}`,
      `Uploaded records: ${result.uploadedRecords}`,
    ];
  }
}
