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
import {
  NotificationService,
  StudentPDPPDNotification,
} from "@sims/services/notifications";
import { NotificationActionsService } from "@sims/services";

@Processor(QueueNames.StudentApplicationNotifications)
export class StudentApplicationNotificationsScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.StudentApplicationNotifications)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly applicationService: ApplicationService,
    private readonly notificationService: NotificationService,
    private readonly notificationActionsService: NotificationActionsService,
  ) {
    super(schedulerQueue, queueService);
  }

  /**
   * Process Student for Email notification - PD/PPD Student reminder email 8 weeks before end date.
   */
  @Process()
  async studentApplicationNotifications(job: Job<void>): Promise<string[]> {
    const processSummary = new ProcessSummary();

    try {
      this.logger.log(
        `Processing student application notifications job. Job id: ${job.id} and Job name: ${job.name}.`,
      );

      const eligibleApplications =
        await this.applicationService.getEligibleApplicationsForNotification();

      const notifications = eligibleApplications.map<StudentPDPPDNotification>(
        (application) => ({
          userId: application.student.user.id,
          givenNames: application.student.user.firstName,
          lastName: application.student.user.lastName,
          email: application.student.user.email,
          applicationNumber: application.applicationNumber,
          assessmentId: application.currentAssessment.id,
        }),
      );

      await this.notificationActionsService.saveStudentApplicationPDPPDNotification(
        notifications,
      );

      processSummary.info(
        `Eligible applications: ${JSON.stringify(eligibleApplications)}`,
      );

      return getSuccessMessageWithAttentionCheck(
        ["Process finalized with success."],
        processSummary,
      );
    } catch (error: unknown) {
      const errorMessage = "Unexpected error while executing the job.";
      processSummary.error(errorMessage, error);
      throw new Error(errorMessage, { cause: error });
    } finally {
      this.logger.logProcessSummary(processSummary);
      await logProcessSummaryToJobLogger(processSummary, job);
      await this.cleanSchedulerQueueHistory();
    }
  }

  @InjectLogger()
  logger: LoggerService;
}
