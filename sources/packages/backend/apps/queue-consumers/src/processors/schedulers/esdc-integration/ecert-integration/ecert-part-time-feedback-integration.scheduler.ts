import { InjectQueue, Processor } from "@nestjs/bull";
import { PartTimeECertFileHandler } from "@sims/integrations/esdc-integration";
import { QueueService } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../../base-scheduler";
import { ProcessSummary } from "@sims/utilities/logger";

@Processor(QueueNames.PartTimeFeedbackIntegration)
export class PartTimeECertFeedbackIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.PartTimeFeedbackIntegration)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly partTimeECertFileHandler: PartTimeECertFileHandler,
  ) {
    super(schedulerQueue, queueService);
    this.logger.setContext(PartTimeECertFeedbackIntegrationScheduler.name);
  }

  /**
   * Download all files from Part Time E-Cert Response folder on SFTP and process them all.
   * @param _job process job.
   * @param processSummary process summary for logging.
   * @returns processing results.
   */
  protected async process(
    _job: Job<void>,
    processSummary: ProcessSummary,
  ): Promise<string> {
    await this.partTimeECertFileHandler.processECertResponses(processSummary);
    return "Process finalized with success.";
  }
}
