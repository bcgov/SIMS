import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { MSFAAResponseService } from "@sims/integrations/esdc-integration";
import { QueueService } from "@sims/services/queue";
import { OfferingIntensity } from "@sims/sims-db";
import { QueueNames } from "@sims/utilities";
import { Job, Queue } from "bull";
import { QueueProcessSummary } from "../../../models/processors.models";
import { BaseScheduler } from "../../base-scheduler";
import { ProcessResponseQueue } from "../models/esdc.dto";

@Processor(QueueNames.PartTimeMSFAAProcessResponseIntegration)
export class PartTimeMSFAAProcessResponseIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.PartTimeMSFAAProcessResponseIntegration)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly msfaaResponseService: MSFAAResponseService,
  ) {
    super(schedulerQueue, queueService);
  }

  /**
   * Download all part time files from MSFAA Response folder on SFTP and process them all.
   * @params job job details.
   * @returns Summary with what was processed and the list of all errors, if any.
   */
  @Process()
  async processMSFAA(job: Job<void>): Promise<ProcessResponseQueue[]> {
    const summary = new QueueProcessSummary({
      appLogger: this.logger,
      jobLogger: job,
    });
    await summary.info(
      `Processing CRA integration job ${job.id} of type ${job.name}.`,
    );
    const results = await this.msfaaResponseService.processResponses(
      OfferingIntensity.partTime,
    );
    await this.cleanSchedulerQueueHistory();

    return results.map((result) => {
      return {
        processSummary: result.processSummary,
        errorsSummary: result.errorsSummary,
      };
    });
  }
}
