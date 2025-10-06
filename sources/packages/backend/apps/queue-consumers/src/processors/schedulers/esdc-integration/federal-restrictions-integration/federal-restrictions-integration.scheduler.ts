import { InjectQueue, Processor } from "@nestjs/bull";
import { FedRestrictionProcessingService } from "@sims/integrations/esdc-integration";
import { QueueService } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../../base-scheduler";
import { ProcessSummary } from "@sims/utilities/logger";

@Processor(QueueNames.FederalRestrictionsIntegration)
export class FederalRestrictionsIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.FederalRestrictionsIntegration)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly fedRestrictionProcessingService: FedRestrictionProcessingService,
  ) {
    super(schedulerQueue, queueService);
    this.logger.setContext(FederalRestrictionsIntegrationScheduler.name);
  }

  /**
   * Federal restriction import.
   * @param _job process job.
   * @param processSummary process summary for logging.
   * @returns processing result.
   */
  protected async process(
    _job: Job<void>,
    processSummary: ProcessSummary,
  ): Promise<string> {
    await this.fedRestrictionProcessingService.process(processSummary);
    return "Federal restrictions import process finished.";
  }
}
