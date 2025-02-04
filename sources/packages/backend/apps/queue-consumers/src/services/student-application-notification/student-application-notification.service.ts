import { Injectable } from "@nestjs/common";
import { ProcessSummary } from "@sims/utilities/logger";
import {
  StudentPDPPDReminderNotification,
  StudentSecondDisbursementReminderNotification,
} from "./student-application-notification-processor";

@Injectable()
export class StudentApplicationNotificationService {
  constructor(
    private readonly studentPdPpdReminderNotification: StudentPDPPDReminderNotification,
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
    await Promise.allSettled(notifications);
  }
}
