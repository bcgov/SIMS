import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../base-scheduler";
import { QueueNames } from "@sims/utilities";
import { QueueService } from "@sims/services/queue";
import { ProcessPDRequestQueueOutDTO } from "./models/atbc-response-integration.dto";
import { ATBCIntegrationProcessingService } from "@sims/integrations/atbc-integration";

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
  ): Promise<ProcessPDRequestQueueOutDTO> {
    await job.log("Processing PD status for students.");
    const processingResult =
      await this.atbcIntegrationProcessingService.processPendingPDRequests();
    await job.log("Completed processing PD status.");
    await this.cleanSchedulerQueueHistory();
    return processingResult;
  }
}
