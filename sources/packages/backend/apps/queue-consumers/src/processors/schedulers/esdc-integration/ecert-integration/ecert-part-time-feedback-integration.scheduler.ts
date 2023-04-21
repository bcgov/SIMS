import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { ECertFileHandler } from "@sims/integrations/esdc-integration";
import { QueueService } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import { Job, Queue } from "bull";
import { QueueProcessSummary } from "../../../models/processors.models";
import { BaseScheduler } from "../../base-scheduler";
import { ESDCFileResponse } from "../models/esdc.models";

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
    const summary = new QueueProcessSummary({
      appLogger: this.logger,
      jobLogger: job,
    });
    await summary.info(
      `Processing e-Cert part-time feedback integration job ${job.id} of type ${job.name}.`,
    );
    const partTimeResults =
      await this.eCertFileHandler.processPartTimeResponses();
    await this.cleanSchedulerQueueHistory();
    await summary.info(
      `Completed e-Cert part-time feedback integration job ${job.id} of type ${job.name}.`,
    );
    return partTimeResults.map((partTimeResult) => ({
      processSummary: partTimeResult.processSummary,
      errorsSummary: partTimeResult.errorsSummary,
    }));
  }
}
