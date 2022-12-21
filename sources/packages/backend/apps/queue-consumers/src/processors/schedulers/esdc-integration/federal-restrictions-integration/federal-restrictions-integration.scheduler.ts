import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { FedRestrictionProcessingService } from "@sims/integrations/esdc-integration/fed-restriction-integration/fed-restriction-processing.service";
import { QueueService } from "@sims/services/queue";
import { SystemUsersService } from "@sims/services/system-users";
import { QueueNames } from "@sims/utilities";
import { InjectLogger, LoggerService } from "@sims/utilities/logger";
import { Job, Queue } from "bull";
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
    this.logger.log(
      `Processing CRA integration job ${job.id} of type ${job.name}.`,
    );
    this.logger.log("Starting federal restrictions import...");
    const auditUser = await this.systemUsersService.systemUser();
    const uploadResult = await this.processingService.process(auditUser.id);
    this.logger.log("Federal restrictions import process finished.");
    await this.cleanSchedulerQueueHistory();
    return {
      processSummary: uploadResult.processSummary,
      errorsSummary: uploadResult.errorsSummary,
    };
  }

  @InjectLogger()
  logger: LoggerService;
}
