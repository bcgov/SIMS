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
import { StudentPDPPDNotification } from "@sims/services/notifications";
import { NotificationActionsService } from "@sims/services";

@Processor(QueueNames.StudentApplicationNotifications)
export class StudentApplicationNotificationsScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.StudentApplicationNotifications)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly applicationService: ApplicationService,
    private readonly notificationActionsService: NotificationActionsService,
  ) {
    super(schedulerQueue, queueService);
  }

  /**
   * To be removed once the method {@link process} is implemented.
   * This method "hides" the {@link Process} decorator from the base class.
   */
  async processQueue(): Promise<string | string[]> {
    throw new Error("Method not implemented.");
  }

  /**
   * When implemented in a derived class, process the queue job.
   * To be implemented.
   */
  protected async process(): Promise<string | string[]> {
    throw new Error("Method not implemented.");
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
        await this.applicationService.getApplicationWithPDPPStatusMismatch();

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

      if (eligibleApplications.length) {
        processSummary.info(
          `PD/PPD mismatch assessments that generated notifications: ${eligibleApplications
            .map((app) => app.currentAssessment.id)
            .join(", ")}`,
        );
      } else {
        processSummary.info(
          `No assessments found to generate PD/PPD mismatch notifications.`,
        );
      }

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
    }
  }

  @InjectLogger()
  logger: LoggerService;
}
