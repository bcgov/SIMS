import { Injectable } from "@nestjs/common";
import { Application, ApplicationStatus } from "@sims/sims-db";
import {
  ApplicationEventCode,
  DisbursementScheduleForApplicationEventDate,
} from "../models/ier12-integration.model";
import { FULL_TIME_DISBURSEMENT_FEEDBACK_ERRORS } from "@sims/integrations/services/disbursement-schedule/disbursement-schedule.models";
import { DISBURSEMENT_FILE_GENERATION_ANTICIPATION_DAYS } from "@sims/services/constants";
import { addDays } from "@sims/utilities";

@Injectable()
export class ApplicationEventDateUtilsService {
  /**
   * Get application event date.
   * @param applicationEventCode application event code.
   * @param application application.
   * @param disbursementSchedule disbursement schedule.
   * @returns application event date.
   */
  getApplicationEventDate(
    applicationEventCode: ApplicationEventCode,
    application: Pick<
      Application,
      "applicationStatus" | "applicationStatusUpdatedOn"
    >,
    disbursementSchedule: DisbursementScheduleForApplicationEventDate,
  ): Date {
    switch (applicationEventCode) {
      case ApplicationEventCode.COER:
        return application.applicationStatus === ApplicationStatus.Enrolment
          ? application.applicationStatusUpdatedOn
          : disbursementSchedule.updatedAt;
      case ApplicationEventCode.DISE:
        return this.getFullTimeFeedbackErrorUpdateAt(
          disbursementSchedule.disbursementFeedbackErrors.map(
            (feedbackError) => ({
              updatedAt: feedbackError.updatedAt,
              errorCode: feedbackError.eCertFeedbackError.errorCode,
            }),
          ),
        );
      case ApplicationEventCode.DISR:
        return addDays(
          -DISBURSEMENT_FILE_GENERATION_ANTICIPATION_DAYS,
          disbursementSchedule.disbursementDate,
        );
      case ApplicationEventCode.DISW:
      case ApplicationEventCode.DISS:
        return disbursementSchedule.dateSent;
      default:
        return disbursementSchedule.updatedAt;
    }
  }

  /**
   * Get full-time feedback error updated at date.
   * @param disbursementFeedbackErrors disbursement feedback errors.
   * @returns full-time feedback error updated at date.
   */
  private getFullTimeFeedbackErrorUpdateAt(
    disbursementFeedbackErrors: { updatedAt: Date; errorCode: string }[],
  ): Date {
    const [{ updatedAt }] = disbursementFeedbackErrors.filter(
      (disbursementFeedbackErrors) =>
        FULL_TIME_DISBURSEMENT_FEEDBACK_ERRORS.includes(
          disbursementFeedbackErrors.errorCode,
        ),
    );
    return updatedAt;
  }
}
