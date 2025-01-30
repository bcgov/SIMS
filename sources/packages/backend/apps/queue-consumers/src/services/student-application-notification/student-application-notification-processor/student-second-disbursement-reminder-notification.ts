import { Injectable } from "@nestjs/common";
import {
  NotificationActionsService,
  StudentSecondDisbursementNotification,
} from "@sims/services";
import { ProcessSummary } from "@sims/utilities/logger";
import { ApplicationService } from "../..";

/**
 * Creates a student email notification - second disbursement date has passed and
 * the institution has not yet approved the second COE/disbursement.
 */
@Injectable()
export class StudentSecondDisbursementReminderNotification {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly notificationActionsService: NotificationActionsService,
  ) {}

  /**
   * Creates a student notification for the second disbursements for which the disbursement
   * date has passed and the institution has not yet approved the second COE/disbursement.
   * @param processSummary process summary for logging.
   */
  async createNotification(processSummary: ProcessSummary): Promise<void> {
    const notificationLog = new ProcessSummary();
    processSummary.children(notificationLog);

    const eligibleDisbursements =
      await this.applicationService.getSecondDisbursementsStillPending();

    if (!eligibleDisbursements.length) {
      notificationLog.info(
        "No disbursements found to generate second disbursement reminder notifications.",
      );
      return;
    }

    const notifications =
      eligibleDisbursements.map<StudentSecondDisbursementNotification>(
        (eligibleDisbursement) => ({
          userId: eligibleDisbursement.userId,
          givenNames: eligibleDisbursement.givenNames,
          lastName: eligibleDisbursement.lastName,
          email: eligibleDisbursement.email,
          assessmentId: eligibleDisbursement.assessmentId,
        }),
      );

    await this.notificationActionsService.saveStudentApplicationSecondDisbursementNotification(
      notifications,
    );

    notificationLog.info(
      `Second disbursements with pending status that generated notifications: ${eligibleDisbursements
        .map((disbursement) => disbursement.assessmentId)
        .join(", ")}`,
    );
  }
}
