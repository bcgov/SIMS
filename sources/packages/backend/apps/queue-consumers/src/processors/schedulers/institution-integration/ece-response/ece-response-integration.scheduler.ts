import { Processor } from "@nestjs/bullmq";
import { QueueNames } from "@sims/utilities";
import { LoggerService, ProcessSummary } from "@sims/utilities/logger";
import { Job } from "bullmq";
import { BaseQueueProcessor } from "../../base-queue-processor";
import { ECEResponseProcessingService } from "@sims/integrations/institution-integration/ece-integration";

@Processor(
  QueueNames.ECEProcessResponseIntegration,
  BaseQueueProcessor.defaultWorkerOptions,
)
export class ECEResponseIntegrationScheduler extends BaseQueueProcessor<void> {
  constructor(
    private readonly eceResponseProcessingService: ECEResponseProcessingService,
    logger: LoggerService,
  ) {
    super(logger);
  }

  /**
   * Process all the institution ECE responses and update the enrolment accordingly.
   * @param _job process job.
   * @param processSummary process summary for logging.
   * @returns Processing result log.
   */
  protected async processQueue(
    _job: Job<void>,
    processSummary: ProcessSummary,
  ): Promise<string[] | string> {
    const processingResult = await this.eceResponseProcessingService.process();
    processingResult.forEach((result) => {
      // Convert each ECE response processing result to a process summary for a location.
      const locationResultSummary = new ProcessSummary();
      processSummary.children(locationResultSummary);
      result.summary.forEach((info) => locationResultSummary.info(info));
      result.warnings.forEach((error) => locationResultSummary.warn(error));
      result.errors.forEach((error) => locationResultSummary.error(error));
      result.children?.forEach((child) => {
        const locationFileSummaryResult = new ProcessSummary();
        locationResultSummary.children(locationFileSummaryResult);
        child.summary.forEach((info) => locationFileSummaryResult.info(info));
        child.warnings.forEach((warning) =>
          locationFileSummaryResult.warn(warning),
        );
        child.errors.forEach((error) => locationFileSummaryResult.error(error));
      });
    });
    return `Institution locations processed as a result of ECE response files received: ${processingResult.length}. Check logs for details.`;
  }
}
