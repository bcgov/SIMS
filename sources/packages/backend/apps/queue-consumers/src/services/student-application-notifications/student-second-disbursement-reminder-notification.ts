import { Injectable } from "@nestjs/common";
import {
  NotificationActionsService,
  StudentSecondDisbursementNotification,
} from "@sims/services";
import { ApplicationService } from "../../services";
import { ProcessSummary } from "@sims/utilities/logger";

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
   * Creates a student notification for the given second disbursement.
   * @param processSummary process summary for logging.
   */
  async createNotification(processSummary: ProcessSummary): Promise<void> {
    const eligibleDisbursements =
      await this.applicationService.getSecondDisbursementsStillPending();

    const notifications =
      eligibleDisbursements.map<StudentSecondDisbursementNotification>(
        (disbursement) => ({
          userId: disbursement.userId,
          givenNames: disbursement.givenNames,
          lastName: disbursement.lastName,
          email: disbursement.email,
          assessmentId: disbursement.assessmentId,
        }),
      );

    await this.notificationActionsService.saveStudentApplicationSecondDisbursementNotification(
      notifications,
    );

    if (eligibleDisbursements.length) {
      processSummary.info(
        `Second disbursements with pending status that generated notifications: ${eligibleDisbursements
          .map((disbursement) => disbursement.assessmentId)
          .join(", ")}`,
      );
    } else {
      processSummary.info(
        `No disbursements found to generate second disbursement reminder notifications.`,
      );
    }
  }
}
