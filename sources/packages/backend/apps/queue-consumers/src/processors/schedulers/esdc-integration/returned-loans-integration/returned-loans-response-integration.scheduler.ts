import { InjectQueue, Processor } from "@nestjs/bull";
import { QueueService } from "@sims/services/queue";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../../base-scheduler";
import { LoggerService, ProcessSummary } from "@sims/utilities/logger";
import { QueueNames } from "@sims/utilities";

@Processor(QueueNames.ReturnedLoansResponseIntegration)
export class ReturnedLoansResponseIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.ReturnedLoansResponseIntegration)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    logger: LoggerService,
  ) {
    super(schedulerQueue, queueService, logger);
  }

  /**
   * Process the returned loans response file(s) and update the relevant records.
   * Both Full-time and Part-time returned loans response files are processed by this scheduler.
   * @param _job process job.
   * @param processSummary process summary for logging.
   * @returns process summary.
   */
  protected async process(
    _job: Job<void>,
    processSummary: ProcessSummary,
  ): Promise<string[]> {
    processSummary.info("Starting RTG response integration processing.");
    // TODO: Implement the processing logic for RTG response integration.

    return ["Process finalized with success.", `Received files: 0.`];
  }
}
