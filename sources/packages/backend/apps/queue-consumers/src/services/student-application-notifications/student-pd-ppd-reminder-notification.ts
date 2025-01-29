import { Injectable } from "@nestjs/common";
import {
  NotificationActionsService,
  StudentPDPPDNotification,
} from "@sims/services";
import { ApplicationService } from "../../services";
import { ProcessSummary } from "@sims/utilities/logger";

/**
 * Creates a student email notification - PD/PPD Student reminder email 8 weeks before end date.
 */
@Injectable()
export class StudentPdPpdReminderNotification {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly notificationActionsService: NotificationActionsService,
  ) {}

  /**
   * Creates a student notification for the given PD/PPD Student reminder.
   * @param processSummary process summary for logging.
   */
  async createNotification(processSummary: ProcessSummary): Promise<void> {
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
  }
}
