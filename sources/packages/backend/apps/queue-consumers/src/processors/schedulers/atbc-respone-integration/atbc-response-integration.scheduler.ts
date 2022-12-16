import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../base-scheduler";
import { QueueNames } from "@sims/utilities";
import { QueueService } from "@sims/services/queue";
import { ProcessPDRequestQueueOutDTO } from "./models/atbc-response-integration.dto";

/**
 * Process all the applied PD requests to verify the status with ATBC.
 */
@Processor(QueueNames.ATBCResponseIntegration)
export class ATBCResponseIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.ATBCResponseIntegration)
    protected readonly schedulerQueue: Queue<void>,
    queueService: QueueService,
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
    job.log("Processing SFAS integration files...");
    //Processing code here.
    job.log("Completed processing SFAS integration files.");
    await this.cleanSchedulerQueueHistory();
    return { pdRequestsProcessed: 0 };
  }
}
