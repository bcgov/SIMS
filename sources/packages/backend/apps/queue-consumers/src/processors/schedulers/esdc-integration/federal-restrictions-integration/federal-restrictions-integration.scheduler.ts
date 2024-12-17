import { InjectQueue, Processor } from "@nestjs/bull";
import { FedRestrictionProcessingService } from "@sims/integrations/esdc-integration";
import { QueueService } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../../base-scheduler";
import {
  InjectLogger,
  LoggerService,
  ProcessSummary,
} from "@sims/utilities/logger";

@Processor(QueueNames.FederalRestrictionsIntegration)
export class FederalRestrictionsIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.FederalRestrictionsIntegration)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly fedRestrictionProcessingService: FedRestrictionProcessingService,
  ) {
    super(schedulerQueue, queueService);
  }

  /**
   * Federal restriction import.
   * @param job process job.
   * @param processSummary process summary for logging.
   * @returns processing result.
   */
  protected async process(
    job: Job<void>,
    processSummary: ProcessSummary,
  ): Promise<string> {
    processSummary.info("Starting federal restrictions import.");
    await this.fedRestrictionProcessingService.process(processSummary);
    return "Federal restrictions import process finished.";
  }

  /**
   * Logger for SFAS integration scheduler.
   * Setting the logger here allows the correct context to be set
   * during the property injection.
   * Even if the logger is not used, it is required to be set, to
   * allow the base classes to write logs using the correct context.
   */
  @InjectLogger()
  logger: LoggerService;
}
