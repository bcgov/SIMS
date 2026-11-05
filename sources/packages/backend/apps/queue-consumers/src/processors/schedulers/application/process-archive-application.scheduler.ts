import { Processor } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { BaseQueueProcessor } from "../base-queue-processor";
import { QueueNames } from "@sims/utilities";
import { ApplicationService } from "../../../services";
import { SystemUsersService } from "@sims/services/system-users";
import { LoggerService, ProcessSummary } from "@sims/utilities/logger";

/**
 * Process applications archiving.
 */
@Processor(
  QueueNames.ProcessArchiveApplications,
  BaseQueueProcessor.defaultWorkerOptions,
)
export class ProcessArchiveApplicationsScheduler extends BaseQueueProcessor<void> {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly systemUsersService: SystemUsersService,
    logger: LoggerService,
  ) {
    super(logger);
  }

  /**
   * Process all the applications pending to be archived.
   * @param _job applications archiving job.
   * @param processSummary process summary for logging.
   * @returns processing result.
   */
  protected async processQueue(
    _job: Job<void>,
    processSummary: ProcessSummary,
  ): Promise<string | string[]> {
    const auditUser = this.systemUsersService.systemUser;
    const archivedApplicationsCount =
      await this.applicationService.archiveApplications(auditUser.id);
    processSummary.info(
      `Total applications archived: ${archivedApplicationsCount}.`,
    );
    return "All applications processed with success.";
  }
}
