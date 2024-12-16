import { InjectQueue, Processor } from "@nestjs/bull";
import { SINValidationProcessingService } from "@sims/integrations/esdc-integration";
import { QueueService } from "@sims/services/queue";
import { SystemUsersService } from "@sims/services/system-users";
import { QueueNames } from "@sims/utilities";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../../base-scheduler";
import {
  InjectLogger,
  LoggerService,
  ProcessSummary,
} from "@sims/utilities/logger";

@Processor(QueueNames.SINValidationResponseIntegration)
export class SINValidationResponseIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.SINValidationResponseIntegration)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly sinValidationProcessingService: SINValidationProcessingService,
    private readonly systemUsersService: SystemUsersService,
  ) {
    super(schedulerQueue, queueService);
  }

  /**
   * Download all SIN validation files from ESDC response folder on SFTP and process them all.
   * @param _job process job.
   * @param processSummary process summary for logging.
   * @returns summary with what was processed and the list of all errors, if any.
   */
  protected async process(
    _job: Job<void>,
    processSummary: ProcessSummary,
  ): Promise<string> {
    const auditUser = this.systemUsersService.systemUser;
    const results = await this.sinValidationProcessingService.processResponses(
      auditUser.id,
    );
    const childProcessSummaries = results.map((result) => {
      const childprocessSummary = new ProcessSummary();
      result.processSummary.forEach((info) => processSummary.info(info));
      result.errorsSummary.forEach((error) => processSummary.error(error));
      return childprocessSummary;
    });
    processSummary.children(...childProcessSummaries);
    return "ESDC SIN validation response files processed.";
  }

  /**
   * Logger for SFAS integration scheduler.
   * Setting the logger here allows the correct context to be set
   * during the property injection.
   * Even if the logger is not used, it is required to be set, to
   * allow the base classes to write logs using the correct context.
   */
  @InjectLogger()
  logger: LoggerService;
}
