import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { SINValidationProcessingService } from "@sims/integrations/esdc-integration";
import { QueueService } from "@sims/services/queue";
import { SystemUsersService } from "@sims/services/system-users";
import { QueueNames } from "@sims/utilities";
import { Job, Queue } from "bull";
import { QueueProcessSummary } from "../../../models/processors.models";
import { BaseScheduler } from "../../base-scheduler";
import { ProcessResponseQueue } from "../models/esdc.models";

@Processor(QueueNames.SINValidationRequestIntegration)
export class SINValidationRequestIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.SINValidationRequestIntegration)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly sinValidationProcessingService: SINValidationProcessingService,
    private readonly systemUsersService: SystemUsersService,
  ) {
    super(schedulerQueue, queueService);
  }

  /**
   * Download all SIN validation files from ESDC response folder on SFTP and process them all.
   * @params job job details.
   * @returns summary with what was processed and the list of all errors, if any.
   */
  @Process()
  async processSINValidationResponse(
    job: Job<void>,
  ): Promise<ProcessResponseQueue[]> {
    const summary = new QueueProcessSummary({
      appLogger: this.logger,
      jobLogger: job,
    });
    await summary.info(
      `Processing SIN validation integration job ${job.id} of type ${job.name}.`,
    );
    await summary.info("Processing ESDC SIN validation response files.");
    const auditUser = this.systemUsersService.systemUser;
    const results = await this.sinValidationProcessingService.processResponses(
      auditUser.id,
    );
    await summary.info("ESDC SIN validation response files processed.");
    await this.cleanSchedulerQueueHistory();
    await summary.info(
      `Completed SIN validation integration job ${job.id} of type ${job.name}.`,
    );
    return results.map((result) => {
      return {
        processSummary: result.processSummary,
        errorsSummary: result.errorsSummary,
      };
    });
  }
}
