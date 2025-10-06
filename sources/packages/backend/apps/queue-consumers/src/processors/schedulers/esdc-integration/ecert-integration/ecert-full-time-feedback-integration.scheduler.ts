import { InjectQueue, Processor } from "@nestjs/bull";
import { FullTimeECertFileHandler } from "@sims/integrations/esdc-integration";
import { QueueService } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../../base-scheduler";
import { ProcessSummary } from "@sims/utilities/logger";

@Processor(QueueNames.FullTimeFeedbackIntegration)
export class FullTimeECertFeedbackIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.FullTimeFeedbackIntegration)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly fullTimeECertFileHandler: FullTimeECertFileHandler,
  ) {
    super(schedulerQueue, queueService);
    this.logger.setContext(FullTimeECertFeedbackIntegrationScheduler.name);
  }

  /**
   * Download all files from FullTime E-Cert Response folder on SFTP and process them all.
   * @param _job process job.
   * @param processSummary process summary for logging.
   * @returns processing results.
   */
  protected async process(
    _job: Job<void>,
    processSummary: ProcessSummary,
  ): Promise<string> {
    await this.fullTimeECertFileHandler.processECertResponses(processSummary);
    return "Process finalized with success.";
  }
}
