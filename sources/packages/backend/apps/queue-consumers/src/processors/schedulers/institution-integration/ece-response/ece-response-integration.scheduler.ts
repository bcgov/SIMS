import { InjectQueue, Processor } from "@nestjs/bull";
import { QueueService } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import { ProcessSummary } from "@sims/utilities/logger";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../../base-scheduler";
import { ECEResponseProcessingService } from "@sims/integrations/institution-integration/ece-integration";

@Processor(QueueNames.ECEProcessResponseIntegration)
export class ECEResponseIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.ECEProcessResponseIntegration)
    schedulerQueue: Queue<void>,
    private readonly eceResponseProcessingService: ECEResponseProcessingService,
    queueService: QueueService,
  ) {
    super(schedulerQueue, queueService);
    this.logger.setContext(ECEResponseIntegrationScheduler.name);
  }

  /**
   * Process all the institution ECE responses and update the enrolment accordingly.
   * @param _job process job.
   * @param processSummary process summary for logging.
   * @returns Processing result log.
   */
  protected async process(
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
    });
    return `ECE response files received: ${processingResult.length}. Check logs for details.`;
  }
}
