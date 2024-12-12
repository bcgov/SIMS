import { InjectQueue, Processor } from "@nestjs/bull";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../base-scheduler";
import { QueueNames } from "@sims/utilities";
import { QueueService } from "@sims/services/queue";
import { ApplicationService } from "../../../services";
import { SystemUsersService } from "@sims/services/system-users";
import { ProcessSummary } from "@sims/utilities/logger";

/**
 * Process applications archiving.
 */
@Processor(QueueNames.ProcessArchiveApplications)
export class ProcessArchiveApplicationsScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.ProcessArchiveApplications)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly applicationService: ApplicationService,
    private readonly systemUsersService: SystemUsersService,
  ) {
    super(schedulerQueue, queueService);
  }

  /**
   * Process all the applications pending to be archived.
   * @param _job applications archiving job.
   * @param processSummary process summary for logging.
   * @returns processing result.
   */
  protected async process(
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
