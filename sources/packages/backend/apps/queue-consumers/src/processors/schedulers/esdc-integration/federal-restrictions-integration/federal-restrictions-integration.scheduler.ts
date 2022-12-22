import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { FedRestrictionProcessingService } from "@sims/integrations/esdc-integration";
import { QueueService } from "@sims/services/queue";
import { SystemUsersService } from "@sims/services/system-users";
import { QueueNames } from "@sims/utilities";
import { Job, Queue } from "bull";
import { QueueProcessSummary } from "../../../models/processors.models";
import { BaseScheduler } from "../../base-scheduler";
import { ESDCFileResponse } from "../models/esdc.dto";

@Processor(QueueNames.FederalRestrictionsIntegration)
export class FederalRestrictionsIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.FederalRestrictionsIntegration)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly processingService: FedRestrictionProcessingService,
    private readonly systemUsersService: SystemUsersService,
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
      `Processing CRA integration job ${job.id} of type ${job.name}.`,
    );
    await summary.info("Starting federal restrictions import...");
    const auditUser = await this.systemUsersService.systemUser();
    const uploadResult = await this.processingService.process(auditUser.id);
    await summary.info("Federal restrictions import process finished.");
    await this.cleanSchedulerQueueHistory();
    return {
      processSummary: uploadResult.processSummary,
      errorsSummary: uploadResult.errorsSummary,
    };
  }
}
