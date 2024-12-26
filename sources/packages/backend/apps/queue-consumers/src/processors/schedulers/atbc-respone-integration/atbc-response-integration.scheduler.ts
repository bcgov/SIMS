import { Job, Queue } from "bull";
import { BaseScheduler } from "../base-scheduler";
import { QueueService } from "@sims/services/queue";
import { ATBCIntegrationProcessingService } from "@sims/integrations/atbc-integration";
import {
  InjectLogger,
  LoggerService,
  ProcessSummary,
} from "@sims/utilities/logger";

/**
 * Process all the applied PD requests to verify the status with ATBC.
 */
export class ATBCResponseIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly atbcIntegrationProcessingService: ATBCIntegrationProcessingService,
  ) {
    super(schedulerQueue, queueService);
  }

  /**
   * Process all the applied disability status requests by students.
   * @param _job process job.
   * @param processSummary process summary for logging.
   * @returns processing result.
   */
  protected async process(
    _job: Job<void>,
    processSummary: ProcessSummary,
  ): Promise<string> {
    await this.atbcIntegrationProcessingService.processAppliedDisabilityRequests(
      processSummary,
    );
    return "Completed processing disability status.";
  }

  /**
   * Setting the logger here allows the correct context to be set
   * during the property injection.
   * Even if the logger is not used, it is required to be set, to
   * allow the base classes to write logs using the correct context.
   */
  @InjectLogger()
  logger: LoggerService;
}
