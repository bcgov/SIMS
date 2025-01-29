import { Injectable } from "@nestjs/common";
import { ProcessSummary } from "@sims/utilities/logger";
import { StudentPdPpdReminderNotification } from "../student-application-notifications/student-pd-ppd-reminder-notification";
import { StudentSecondDisbursementReminderNotification } from "../student-application-notifications/student-second-disbursement-reminder-notification";

@Injectable()
export class StudentApplicationNotificationService {
  constructor(
    private readonly studentPdPpdReminderNotification: StudentPdPpdReminderNotification,
    private readonly studentSecondDisbursementReminderNotification: StudentSecondDisbursementReminderNotification,
  ) {}

  /**
   * Checks and creates student application notification(s).
   * @param processSummary process summary for logging.
   */
  async notifyStudentApplication(
    processSummary: ProcessSummary,
  ): Promise<void> {
    const notifications = [
      this.studentPdPpdReminderNotification,
      this.studentSecondDisbursementReminderNotification,
    ].map((notification) => notification.createNotification(processSummary));
    await Promise.all(notifications);
  }
}
