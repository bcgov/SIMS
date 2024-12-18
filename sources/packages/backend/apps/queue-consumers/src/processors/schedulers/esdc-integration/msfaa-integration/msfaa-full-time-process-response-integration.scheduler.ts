import { InjectQueue, Processor } from "@nestjs/bull";
import { MSFAAResponseProcessingService } from "@sims/integrations/esdc-integration";
import { QueueService } from "@sims/services/queue";
import { OfferingIntensity } from "@sims/sims-db";
import { QueueNames } from "@sims/utilities";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../../base-scheduler";
import {
  InjectLogger,
  LoggerService,
  ProcessSummary,
} from "@sims/utilities/logger";

@Processor(QueueNames.FullTimeMSFAAProcessResponseIntegration)
export class FullTimeMSFAAProcessResponseIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.FullTimeMSFAAProcessResponseIntegration)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly msfaaResponseService: MSFAAResponseProcessingService,
  ) {
    super(schedulerQueue, queueService);
  }

  /**
   * Download all fulltime files from MSFAA Response folder on SFTP and process them all.
   * @param _job process job.
   * @param processSummary process summary for logging.
   * @returns process result.
   */
  protected async process(
    _job: Job<void>,
    processSummary: ProcessSummary,
  ): Promise<string> {
    await this.msfaaResponseService.processResponses(
      OfferingIntensity.fullTime,
      processSummary,
    );
    return "MSFAA full-time response files processed.";
  }

  /**
   * Setting the logger here allows the correct context to be set
   * during the property injection.
   * Even if the logger is not used, it is required to be set, to
   * allow the base classes to write logs using the correct context.
   */
  @InjectLogger()
  logger: LoggerService;
}
