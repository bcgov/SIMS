import { Processor } from "@nestjs/bullmq";
import { CRAIncomeVerificationProcessingService } from "@sims/integrations/cra-integration/cra-income-verification.processing.service";
import { QueueNames } from "@sims/utilities";
import { LoggerService, ProcessSummary } from "@sims/utilities/logger";
import { Job } from "bullmq";
import { BaseQueueProcessor } from "../base-queue-processor";

@Processor(
  QueueNames.CRAProcessIntegration,
  BaseQueueProcessor.defaultWorkerOptions,
)
export class CRAProcessIntegrationScheduler extends BaseQueueProcessor<void> {
  constructor(
    private readonly cra: CRAIncomeVerificationProcessingService,
    logger: LoggerService,
  ) {
    super(logger);
  }

  /**
   * Identifies all the student applications that have a pending
   * income verification and generate the request file to be
   * processed by CRA.
   * @param _job process job.
   * @param processSummary process summary for logging.
   * @returns processing result.
   */
  protected async processQueue(
    _job: Job<void>,
    processSummary: ProcessSummary,
  ): Promise<string[]> {
    processSummary.info("Executing income validation.");
    const uploadResult = await this.cra.createIncomeVerificationRequest();
    processSummary.info("Income validation executed.");
    return [
      `Generated file: ${uploadResult.generatedFile}`,
      `Uploaded records: ${uploadResult.uploadedRecords}`,
    ];
  }
}
