import { Injectable } from "@nestjs/common";
import { StudentAssessmentService } from "../../";
import { ProcessSummary } from "@sims/utilities/logger";
import {
  NotificationActionsService,
  StudentNotification,
} from "@sims/services";
import { STUDENT_ASSESSMENT_NOTIFICATION_OVERDUE_DAYS } from "@sims/services/constants/system-configurations-constants";

/**
 * Creates a assessment ready for review and acceptance reminder notification to notify student
 * when the application been has assessed at least 7 days and they are unblocked.
 */
@Injectable()
export class StudentAssessmentReminderNotification {
  constructor(
    private readonly studentAssessmentService: StudentAssessmentService,
    private readonly notificationActionsService: NotificationActionsService,
  ) {}

  /**
   * Creates a assessment ready for review and acceptance reminder notification.
   * @param processSummary process summary for logging.
   */
  async createNotification(processSummary: ProcessSummary): Promise<void> {
    const notificationLog = new ProcessSummary();
    processSummary.children(notificationLog);

    const overdueAssessments =
      await this.studentAssessmentService.getOverdueAssessments();

    if (!overdueAssessments.length) {
      notificationLog.info(
        `No assessments ${STUDENT_ASSESSMENT_NOTIFICATION_OVERDUE_DAYS} days past due found to generate reminder notifications.`,
      );
      return;
    }

    const notifications = overdueAssessments.map<StudentNotification>(
      (assessment) => ({
        userId: assessment.application.student.user.id,
        givenNames: assessment.application.student.user.firstName,
        lastName: assessment.application.student.user.lastName,
        toAddress: assessment.application.student.user.email,
        applicationNumber: assessment.application.applicationNumber,
        assessmentId: assessment.id,
      }),
    );

    await this.notificationActionsService.saveStudentAssessmentReminderNotification(
      notifications,
    );

    notificationLog.info(
      `Overdue application assessments that generated reminder notifications: ${overdueAssessments
        .map((assessment) => assessment.application.applicationNumber)
        .join(", ")}`,
    );
  }
}
