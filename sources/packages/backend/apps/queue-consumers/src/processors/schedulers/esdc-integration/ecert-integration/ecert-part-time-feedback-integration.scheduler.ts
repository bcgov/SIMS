import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { ECertFileHandler } from "@sims/integrations/esdc-integration/e-cert-integration/e-cert-file-handler";
import { QueueService } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import { InjectLogger, LoggerService } from "@sims/utilities/logger";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../../base-scheduler";
import { ESDCFileResponse } from "../models/esdc.dto";

@Processor(QueueNames.PartTimeFeedbackIntegration)
export class PartTimeECertFeedbackIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.PartTimeFeedbackIntegration)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly eCertFileHandler: ECertFileHandler,
  ) {
    super(schedulerQueue, queueService);
  }

  /**
   * Download all files from Part Time E-Cert Response folder on SFTP and process them all.
   * @params job job details.
   * @returns Summary with what was processed and the list of all errors, if any.
   */
  @Process()
  async processPartTimeResponses(job: Job<void>): Promise<ESDCFileResponse[]> {
    this.logger.log(
      `Processing CRA integration job ${job.id} of type ${job.name}.`,
    );
    const partTimeResults =
      await this.eCertFileHandler.processPartTimeResponses();
    await this.cleanSchedulerQueueHistory();
    return partTimeResults.map((partTimeResult) => ({
      processSummary: partTimeResult.processSummary,
      errorsSummary: partTimeResult.errorsSummary,
    }));
  }

  @InjectLogger()
  logger: LoggerService;
}
