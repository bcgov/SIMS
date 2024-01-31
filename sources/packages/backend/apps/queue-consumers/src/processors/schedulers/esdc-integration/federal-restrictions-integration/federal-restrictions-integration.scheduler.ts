import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { FedRestrictionProcessingService } from "@sims/integrations/esdc-integration";
import { QueueService } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import { Job, Queue } from "bull";
import { QueueProcessSummary } from "../../../models/processors.models";
import { BaseScheduler } from "../../base-scheduler";
import { ESDCFileResponse } from "../models/esdc.models";

@Processor(QueueNames.FederalRestrictionsIntegration)
export class FederalRestrictionsIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.FederalRestrictionsIntegration)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly fedRestrictionProcessingService: FedRestrictionProcessingService,
  ) {
    super(schedulerQueue, queueService);
  }

  /**
   * Federal restriction import.
   * @params job job details.
   * @returns Summary details of processing.
   */
  @Process()
  async processFedRestrictionsImport(
    job: Job<void>,
  ): Promise<ESDCFileResponse> {
    const summary = new QueueProcessSummary({
      appLogger: this.logger,
      jobLogger: job,
    });
    await summary.info(
      `Processing federal restriction integration job ${job.id} of type ${job.name}.`,
    );
    await summary.info("Starting federal restrictions import...");
    const uploadResult = await this.fedRestrictionProcessingService.process();
    await summary.info("Federal restrictions import process finished.");
    await this.cleanSchedulerQueueHistory();
    await summary.info(
      `Completed federal restriction integration job ${job.id} of type ${job.name}.`,
    );
    return {
      processSummary: uploadResult.processSummary,
      errorsSummary: uploadResult.errorsSummary,
    };
  }
}
