import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { Job, Queue } from "bull";
import { SFASProcessingResultQueueOutDTO } from "./models/sfas-integration.dto";
import { BaseScheduler } from "../base-scheduler";
import { QueueNames } from "@sims/utilities";
import { QueueService } from "@sims/services/queue";
import { LoggerService, InjectLogger } from "@sims/utilities/logger";

/**
 * Process all SFAS integration files from the SFTP location.
 */
@Processor(QueueNames.SFASSIntegration)
export class SFASIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.SFASSIntegration)
    protected readonly schedulerQueue: Queue<void>,
    protected readonly queueService: QueueService,
  ) {
    super(schedulerQueue, queueService);
  }

  /**
   * Process all SFAS integration files from the SFTP
   * and update the database with processed records.
   * @param job SFAS integration job.
   * @returns processing result.
   */
  @Process()
  async processNotifications(
    job: Job<void>,
  ): Promise<SFASProcessingResultQueueOutDTO[]> {
    this.logger.log("Processing SFAS integration files...");
    console.log(job.data);
    this.logger.log("Completed processing SFAS integration files.");
    return [];
  }

  @InjectLogger()
  logger: LoggerService;
}
