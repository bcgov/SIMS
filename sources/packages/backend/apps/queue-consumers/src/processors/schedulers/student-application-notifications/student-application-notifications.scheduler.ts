import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { QueueService } from "@sims/services/queue";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../base-scheduler";
import {
  InjectLogger,
  LoggerService,
  ProcessSummary,
} from "@sims/utilities/logger";
import {
  getSuccessMessageWithAttentionCheck,
  logProcessSummaryToJobLogger,
} from "../../../utilities";
import { QueueNames } from "@sims/utilities";
import { ApplicationService } from "../../../services";
import { DisabilityStatus } from "@sims/sims-db";
import { NotificationService } from "@sims/services/notifications";

@Processor(QueueNames.StudentApplicationNotifications)
export class StudentApplicationNotificationsScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.StudentApplicationNotifications)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly applicationService: ApplicationService,
    private readonly notificationService: NotificationService,
  ) {
    super(schedulerQueue, queueService);
  }

  @Process()
  async StudentApplicationNotifications(job: Job<void>): Promise<string[]> {
    const processSummary = new ProcessSummary();

    try {
      this.logger.log(
        `Processing student application notifications job. Job id: ${job.id} and Job name: ${job.name}.`,
      );

      const eligibleApplications =
        await this.applicationService.getEligibleApplicationsForNotification();

      // for (const application of eligibleApplications) {
      //   const disabilityStatusMismatch =
      //     application.disabilityDetails.calculatedPDPPDStatus &&
      //     ![DisabilityStatus.PD, DisabilityStatus.PPD].includes(
      //       application.disabilityDetails.studentProfileDisabilityStatus,
      //     );

      //   if (disabilityStatusMismatch) {
      //     await this.notificationService.sendDisabilityStatusMismatchNotification(
      //       application,
      //     );
      //     await this.applicationService.markNotificationSent(application.id);
      //   }
      // }

      processSummary.info(
        `Processed ${eligibleApplications.length} applications.`,
      );

      return getSuccessMessageWithAttentionCheck(
        ["Process finalized with success."],
        processSummary,
      );
    } catch (error: unknown) {
      const errorMessage = "Unexpected error while executing the job.";
      processSummary.error(errorMessage, error);
      return [errorMessage];
    } finally {
      this.logger.logProcessSummary(processSummary);
      await logProcessSummaryToJobLogger(processSummary, job);
      await this.cleanSchedulerQueueHistory();
    }
  }

  @InjectLogger()
  logger: LoggerService;
}
