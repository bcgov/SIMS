import { InjectQueue, Processor } from "@nestjs/bull";
import { SINValidationProcessingService } from "@sims/integrations/esdc-integration";
import { QueueService } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../../base-scheduler";
import { ProcessSummary } from "@sims/utilities/logger";

@Processor(QueueNames.SINValidationResponseIntegration)
export class SINValidationResponseIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.SINValidationResponseIntegration)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly sinValidationProcessingService: SINValidationProcessingService,
  ) {
    super(schedulerQueue, queueService);
    this.logger.setContext(SINValidationResponseIntegrationScheduler.name);
  }

  /**
   * Download all SIN validation files from ESDC response folder on SFTP and process them all.
   * @param _job process job.
   * @param processSummary process summary for logging.
   * @returns summary with what was processed and the list of all errors, if any.
   */
  protected async process(
    _job: Job<void>,
    processSummary: ProcessSummary,
  ): Promise<string> {
    const childProcessSummary = new ProcessSummary();
    processSummary.children(childProcessSummary);
    await this.sinValidationProcessingService.processResponses(
      childProcessSummary,
    );
    return "ESDC SIN validation response files processed.";
  }
}
