import { Injectable } from "@nestjs/common";
import {
  NotificationActionsService,
  StudentCOERequiredNearEndDateNotification,
} from "@sims/services";
import { ProcessSummary } from "@sims/utilities/logger";
import { ApplicationService } from "../..";

/**
 * Creates a student email notification when the study end date is within 10 days
 * and at least one COE is still required on the most recent assessment.
 */
@Injectable()
export class StudentCOERequiredNearEndDateReminderNotification {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly notificationActionsService: NotificationActionsService,
  ) {}

  /**
   * Creates a student notification for applications with COE required near study end date.
   * @param processSummary process summary for logging.
   */
  async createNotification(processSummary: ProcessSummary): Promise<void> {
    const notificationLog = new ProcessSummary();
    processSummary.children(notificationLog);

    const eligibleApplications =
      await this.applicationService.getCOERequiredNearEndDate();

    if (!eligibleApplications.length) {
      notificationLog.info(
        "No applications found with COE required near study end date.",
      );
      return;
    }

    const notifications =
      eligibleApplications.map<StudentCOERequiredNearEndDateNotification>(
        (application) => ({
          userId: application.userId,
          givenNames: application.givenNames,
          lastName: application.lastName,
          email: application.email,
          assessmentId: application.assessmentId,
          applicationNumber: application.applicationNumber,
        }),
      );

    await this.notificationActionsService.saveStudentCOERequiredNearEndDateNotification(
      notifications,
    );

    notificationLog.info(
      `Assessments with COE required near end date that generated notifications: ${eligibleApplications
        .map((application) => application.assessmentId)
        .join(", ")}.`,
    );
  }
}
