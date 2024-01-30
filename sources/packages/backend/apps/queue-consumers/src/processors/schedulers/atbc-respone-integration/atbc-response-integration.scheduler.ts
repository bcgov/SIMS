import { Process } from "@nestjs/bull";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../base-scheduler";
import { QueueService } from "@sims/services/queue";
import { ATBCIntegrationProcessingService } from "@sims/integrations/atbc-integration";
import {
  QueueProcessSummary,
  QueueProcessSummaryResult,
} from "../../models/processors.models";
import { ConfigService } from "@sims/utilities/config";

/**
 * Process all the applied PD requests to verify the status with ATBC.
 */
export class ATBCResponseIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly atbcIntegrationProcessingService: ATBCIntegrationProcessingService,
    protected readonly configService: ConfigService,
  ) {
    super(schedulerQueue, queueService, configService);
  }

  /**
   * Process all the applied disability status requests by students.
   * @param job ATBC response integration job.
   * @returns processing result.
   */
  @Process()
  async processPendingPDRequests(
    job: Job<void>,
  ): Promise<QueueProcessSummaryResult> {
    const summary = new QueueProcessSummary({
      appLogger: this.logger,
      jobLogger: job,
    });
    await summary.info("Processing disability status for students.");
    const processingResult =
      await this.atbcIntegrationProcessingService.processAppliedDisabilityRequests();
    await summary.info("Completed processing disability status.");
    await this.cleanSchedulerQueueHistory();
    return processingResult;
  }
}
