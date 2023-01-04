import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { ECertFileHandler } from "@sims/integrations/esdc-integration";
import { QueueService } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import { Job, Queue } from "bull";
import { QueueProcessSummary } from "../../../models/processors.models";
import { BaseScheduler } from "../../base-scheduler";
import { ESDCFileResponse } from "../models/esdc.models";

@Processor(QueueNames.FullTimeFeedbackIntegration)
export class FullTimeECertFeedbackIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.FullTimeFeedbackIntegration)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly eCertFileHandler: ECertFileHandler,
  ) {
    super(schedulerQueue, queueService);
  }

  /**
   * Download all files from FullTime E-Cert Response folder on SFTP and process them all.
   * @params job job details.
   * @returns Summary with what was processed and the list of all errors, if any.
   */
  @Process()
  async processFullTimeResponses(job: Job<void>): Promise<ESDCFileResponse[]> {
    const summary = new QueueProcessSummary({
      appLogger: this.logger,
      jobLogger: job,
    });
    await summary.info(
      `Processing E-Cert Full-time integration job ${job.id} of type ${job.name}.`,
    );
    const fullTimeResults =
      await this.eCertFileHandler.processFullTimeResponses();
    await this.cleanSchedulerQueueHistory();
    await summary.info(
      `Completed E-Cert Full-time integration job ${job.id} of type ${job.name}.`,
    );
    return fullTimeResults.map((fullTimeResult) => ({
      processSummary: fullTimeResult.processSummary,
      errorsSummary: fullTimeResult.errorsSummary,
    }));
  }
}
