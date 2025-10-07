import { Job, Queue } from "bull";
import { BaseScheduler } from "../base-scheduler";
import { QueueService } from "@sims/services/queue";
import { ATBCIntegrationProcessingService } from "@sims/integrations/atbc-integration";
import { LoggerService, ProcessSummary } from "@sims/utilities/logger";

/**
 * Process all the applied PD requests to verify the status with ATBC.
 */
export class ATBCResponseIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly atbcIntegrationProcessingService: ATBCIntegrationProcessingService,
    logger: LoggerService,
  ) {
    super(schedulerQueue, queueService, logger);
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
}
