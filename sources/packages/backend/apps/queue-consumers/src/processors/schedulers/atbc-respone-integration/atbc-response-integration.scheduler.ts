import { Process } from "@nestjs/bull";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../base-scheduler";
import { QueueService } from "@sims/services/queue";
import { ATBCIntegrationProcessingService } from "@sims/integrations/atbc-integration";
import {
  QueueProcessSummary,
  QueueProcessSummaryResult,
} from "../../models/processors.models";

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
   * To be removed once the method {@link process} is implemented.
   * This method "hides" the {@link Process} decorator from the base class.
   */
  async processQueue(): Promise<string | string[]> {
    throw new Error("Method not implemented.");
  }

  /**
   * When implemented in a derived class, process the queue job.
   * To be implemented.
   */
  protected async process(): Promise<string | string[]> {
    throw new Error("Method not implemented.");
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
    return processingResult;
  }
}
