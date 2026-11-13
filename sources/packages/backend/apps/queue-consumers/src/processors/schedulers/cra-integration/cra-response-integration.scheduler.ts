import { Processor } from "@nestjs/bullmq";
import { CRAIncomeVerificationProcessingService } from "@sims/integrations/cra-integration/cra-income-verification.processing.service";
import { QueueNames } from "@sims/utilities";
import { LoggerService, ProcessSummary } from "@sims/utilities/logger";
import { Job } from "bullmq";
import { BaseQueueProcessor } from "../base-queue-processor";

@Processor(
  QueueNames.CRAResponseIntegration,
  BaseQueueProcessor.defaultWorkerOptions,
)
export class CRAResponseIntegrationScheduler extends BaseQueueProcessor<void> {
  constructor(
    private readonly cra: CRAIncomeVerificationProcessingService,
    logger: LoggerService,
  ) {
    super(logger);
  }

  /**
   * Download all files from CRA Response folder on SFTP and process them all.
   * @params job job details.
   * @returns Summary with what was processed and the list of all errors, if any.
   */
  protected async processQueue(
    _job: Job<void>,
    processSummary: ProcessSummary,
  ): Promise<string> {
    const results = await this.cra.processResponses();
    processSummary.info(`CRA response files processed: ${results.length}`);
    const responsesSummaries = results.map((result) => {
      const responseSummary = new ProcessSummary();
      result.processSummary.forEach((info) => responseSummary.info(info));
      result.errorsSummary.forEach((error) => responseSummary.error(error));
      return responseSummary;
    });
    processSummary.children(...responsesSummaries);
    return "Processed CRA response files.";
  }
}
