import { Injectable } from "@nestjs/common";
import { ApplicationService } from "../../";
import { ProcessSummary } from "@sims/utilities/logger";
import {
  NotificationActionsService,
  StudentAcceptAssessmentReminderNotification,
} from "@sims/services";
import { STUDENT_ASSESSMENT_NOTIFICATION_OVERDUE_DAYS } from "@sims/services/constants/system-configurations-constants";

/**
 * Creates an assessment reminder notification to notify a student
 * when the application has been in assessment for at least 7 days.
 */
@Injectable()
export class StudentAssessmentReminderNotification {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly notificationActionsService: NotificationActionsService,
  ) {}

  /**
   * Creates an assessment reminder notification.
   * @param processSummary process summary for logging.
   */
  async createNotification(processSummary: ProcessSummary): Promise<void> {
    const notificationLog = new ProcessSummary();
    processSummary.children(notificationLog);

    const applications =
      await this.applicationService.getApplicationsWithOverdueAssessments();

    if (!applications.length) {
      notificationLog.info(
        `No assessments awaiting acceptance ${STUDENT_ASSESSMENT_NOTIFICATION_OVERDUE_DAYS} days past due found to generate reminder notifications.`,
      );
      return;
    }

    const notifications =
      applications.map<StudentAcceptAssessmentReminderNotification>(
        (application) => ({
          userId: application.student.user.id,
          givenNames: application.student.user.firstName,
          lastName: application.student.user.lastName,
          toAddress: application.student.user.email,
          applicationNumber: application.applicationNumber,
          assessmentId: application.currentAssessment!.id,
        }),
      );

    await this.notificationActionsService.saveStudentAssessmentReminderNotification(
      notifications,
    );

    notificationLog.info(
      `Overdue assessments awaiting acceptance that generated reminder notifications: ${applications
        .map((application) => application.applicationNumber)
        .join(", ")}`,
    );
  }
}
