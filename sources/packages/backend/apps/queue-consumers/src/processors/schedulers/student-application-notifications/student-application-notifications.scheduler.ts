import { InjectQueue, Processor } from "@nestjs/bull";
import { QueueService } from "@sims/services/queue";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../base-scheduler";
import {
  InjectLogger,
  LoggerService,
  ProcessSummary,
} from "@sims/utilities/logger";
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
   * Process Student for Email notification - PD/PPD Student reminder email 8 weeks before end date.
   * @param _job process job.
   * @param processSummary process summary for logging.
   * @returns processing result.
   */
  protected async process(
    _job: Job<void>,
    processSummary: ProcessSummary,
  ): Promise<string> {
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
    return "Process finalized with success.";
  }

  /**
   * Setting the logger here allows the correct context to be set
   * during the property injection.
   * Even if the logger is not used, it is required to be set, to
   * allow the base classes to write logs using the correct context.
   */
  @InjectLogger()
  logger: LoggerService;
}
