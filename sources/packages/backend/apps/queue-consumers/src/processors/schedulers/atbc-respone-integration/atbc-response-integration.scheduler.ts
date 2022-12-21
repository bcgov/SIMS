import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../base-scheduler";
import { QueueNames } from "@sims/utilities";
import { QueueService } from "@sims/services/queue";
import { ATBCIntegrationProcessingService } from "@sims/integrations/atbc-integration";
import {
  QueueProcessSummary,
  QueueProcessSummaryResult,
} from "../../models/processors.models";

/**
 * Process all the applied PD requests to verify the status with ATBC.
 */
@Processor(QueueNames.ATBCResponseIntegration)
export class ATBCResponseIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.ATBCResponseIntegration)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly atbcIntegrationProcessingService: ATBCIntegrationProcessingService,
  ) {
    super(schedulerQueue, queueService);
  }

  /**
   * Process all the applied PD requests to verify the status with ATBC
   * and update the database with processed records.
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
    await summary.info("Processing PD status for students.");
    const processingResult =
      await this.atbcIntegrationProcessingService.processPendingPDRequests();
    await summary.info(
      `Total PD request status processed ${processingResult.pdRequestsProcessed}`,
    );
    await summary.info(
      `Total PD request status updated ${processingResult.pdRequestsUpdated}`,
    );
    await summary.info("Completed processing PD status.");
    await this.cleanSchedulerQueueHistory();
    return summary.getSummary();
  }
}
