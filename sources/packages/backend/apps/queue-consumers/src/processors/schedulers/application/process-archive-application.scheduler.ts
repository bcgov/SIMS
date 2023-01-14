import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../base-scheduler";
import { QueueNames } from "@sims/utilities";
import { QueueService } from "@sims/services/queue";
import { ApplicationService } from "../../../services";
import {
  QueueProcessSummary,
  QueueProcessSummaryResult,
} from "../../models/processors.models";
import { SystemUsersService } from "@sims/services/system-users";

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
   * @param job applications archiving job.
   * @returns processing result.
   */
  @Process()
  async processArchiveApplications(
    job: Job<void>,
  ): Promise<QueueProcessSummaryResult> {
    const summary = new QueueProcessSummary({
      appLogger: this.logger,
      jobLogger: job,
    });
    await summary.info("Processing pending applications to be archived.");

    const auditUser = await this.systemUsersService.systemUser();
    const archivedApplicationsCount =
      await this.applicationService.archiveApplications(auditUser.id);
    await summary.info(
      `Total of applications archived: ${archivedApplicationsCount}`,
    );
    await summary.info("Completed applications archiving process.");
    await this.cleanSchedulerQueueHistory();
    return summary.getSummary();
  }
}
