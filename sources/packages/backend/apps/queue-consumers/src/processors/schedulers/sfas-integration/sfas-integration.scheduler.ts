import { InjectQueue, Processor } from "@nestjs/bull";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../base-scheduler";
import { QueueNames } from "@sims/utilities";
import { QueueService } from "@sims/services/queue";
import { SFASIntegrationProcessingService } from "@sims/integrations/sfas-integration";
import {
  InjectLogger,
  LoggerService,
  ProcessSummary,
} from "@sims/utilities/logger";

/**
 * Process all SFAS integration files from the SFTP location.
 */
@Processor(QueueNames.SFASIntegration)
export class SFASIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.SFASIntegration)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly sfasIntegrationProcessingService: SFASIntegrationProcessingService,
  ) {
    super(schedulerQueue, queueService);
  }

  /**
   * Process all SFAS integration files from the SFTP
   * and update the database with processed records.
   * @param _job SFAS integration job.
   * @param processSummary process summary for logging.
   * @returns processing result.
   */
  protected async process(
    _job: Job<void>,
    processSummary: ProcessSummary,
  ): Promise<string | string[]> {
    processSummary.info("Processing SFAS integration files.");
    const childProcessSummary = new ProcessSummary();
    processSummary.children(childProcessSummary);
    await this.sfasIntegrationProcessingService.process(childProcessSummary);
    return "Completed processing SFAS integration files.";
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
