import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { SINValidationProcessingService } from "@sims/integrations/esdc-integration/sin-validation/sin-validation-processing.service";
import { QueueService } from "@sims/services/queue";
import { SystemUsersService } from "@sims/services/system-users";
import { QueueNames } from "@sims/utilities";
import { InjectLogger, LoggerService } from "@sims/utilities/logger";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../../base-scheduler";
import { ProcessResponseQueueOutDTO } from "../models/esdc.dto";

@Processor(QueueNames.SINValidationRequestIntegration)
export class SINValidationRequestIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.SINValidationRequestIntegration)
    protected readonly schedulerQueue: Queue<void>,
    protected readonly queueService: QueueService,
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
  ): Promise<ProcessResponseQueueOutDTO[]> {
    this.logger.log(
      `Processing CRA integration job ${job.id} of type ${job.name}.`,
    );
    this.logger.log("Processing ESDC SIN validation response files.");
    const auditUser = await this.systemUsersService.systemUser();
    const results = await this.sinValidationProcessingService.processResponses(
      auditUser.id,
    );
    this.logger.log("ESDC SIN validation response files processed.");
    await this.cleanSchedulerQueueHistory();
    return results.map((result) => {
      return {
        processSummary: result.processSummary,
        errorsSummary: result.errorsSummary,
      };
    });
  }

  @InjectLogger()
  logger: LoggerService;
}
