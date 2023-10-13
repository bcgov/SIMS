import { Injectable } from "@nestjs/common";
import {
  COEStatus,
  DisbursementFeedbackErrors,
  DisbursementSchedule,
  DisbursementScheduleStatus,
  RestrictionActionType,
} from "@sims/sims-db";
import { addDays, isSameOrAfterDate } from "@sims/utilities";
import { DisbursementValueService } from "@sims/integrations/services";
import { DISBURSEMENT_FILE_GENERATION_ANTICIPATION_DAYS } from "@sims/integrations/constants";
import {
  ApplicationEventCode,
  CompletedApplicationEventCode,
  CompletedApplicationWithPendingDisbursement,
  CompletedApplicationWithSentDisbursement,
} from "../models/ier12-integration.model";
import { FULL_TIME_DISBURSEMENT_FEEDBACK_ERRORS } from "@sims/integrations/services/disbursement-schedule/disbursement-schedule.models";

@Injectable()
export class ApplicationEventCodeDuringEnrolmentAndCompletedUtilsService {
  constructor(
    private readonly disbursementValueService: DisbursementValueService,
  ) {}

  /**
   * Get application event code for an application with enrollment/completed status.
   * @param coeStatus coe status.
   * @returns application event code.
   */
  applicationEventCodeDuringEnrolmentAndCompleted(
    coeStatus: COEStatus,
  ): ApplicationEventCode.COER | ApplicationEventCode.COED {
    switch (coeStatus) {
      case COEStatus.required:
        return ApplicationEventCode.COER;
      case COEStatus.declined:
        return ApplicationEventCode.COED;
      default:
        throw new Error("Unexpected coe status.");
    }
  }

  /**
   * Get application event code for an application with completed status.
   * @param currentDisbursementSchedule current disbursement schedule.
   * @param activeRestrictionsActionTypes action types for active student restrictions.
   * @returns application event code.
   */
  async applicationEventCodeDuringCompleted(
    currentDisbursementSchedule: Pick<
      DisbursementSchedule,
      | "id"
      | "coeStatus"
      | "disbursementDate"
      | "disbursementScheduleStatus"
      | "disbursementFeedbackErrors"
    >,
    activeRestrictionsActionTypes?: RestrictionActionType[][],
  ): Promise<CompletedApplicationEventCode> {
    switch (currentDisbursementSchedule.disbursementScheduleStatus) {
      case DisbursementScheduleStatus.Cancelled:
        return ApplicationEventCode.DISC;
      case DisbursementScheduleStatus.Pending:
        return this.eventCodeForCompletedApplicationWithPendingDisbursement(
          currentDisbursementSchedule,
          activeRestrictionsActionTypes,
        );
      case DisbursementScheduleStatus.Sent:
        return this.eventCodeForCompletedApplicationWithSentDisbursement(
          currentDisbursementSchedule.id,
          currentDisbursementSchedule.disbursementFeedbackErrors,
        );
    }
  }

  /**
   * Get application event code for an application with completed status
   * with sent disbursement and with no feedback errors and any disbursement
   * award (full amount or a partial) was withheld due to a restriction.
   * @param currentDisbursementScheduleId current disbursement schedule id.
   * @returns application event code.
   */
  private async eventCodeForCompletedApplicationWithAwardWithheldDueToRestriction(
    currentDisbursementScheduleId: number,
  ): Promise<ApplicationEventCode.DISW | ApplicationEventCode.DISS> {
    // Check if any disbursement award (full amount or a partial)
    // was withheld due to a restriction.
    const hasAwardWithheldDueToRestriction =
      await this.disbursementValueService.hasAwardWithheldDueToRestriction(
        currentDisbursementScheduleId,
      );
    return hasAwardWithheldDueToRestriction
      ? ApplicationEventCode.DISW
      : ApplicationEventCode.DISS;
  }

  /**
   * Checks if there is any full-time disbursement feedback errors.
   * @param disbursementFeedbackErrors disbursement feedback errors.
   * @returns true, if there is any full-time disbursement feedback
   * errors.
   */
  private hasFullTimeDisbursementFeedbackErrors(
    disbursementFeedbackErrors?: DisbursementFeedbackErrors[],
  ): boolean {
    return disbursementFeedbackErrors?.some((disbursementFeedbackError) =>
      FULL_TIME_DISBURSEMENT_FEEDBACK_ERRORS.includes(
        disbursementFeedbackError.errorCode,
      ),
    );
  }

  /**
   * Get application event code for an application with completed status
   * with sent disbursement.
   * @param currentDisbursementScheduleId current disbursement schedule id.
   * @param disbursementFeedbackErrors disbursement feedback errors.
   * @returns application event code.
   */
  private async eventCodeForCompletedApplicationWithSentDisbursement(
    currentDisbursementScheduleId: number,
    disbursementFeedbackErrors: DisbursementFeedbackErrors[],
  ): Promise<CompletedApplicationWithSentDisbursement> {
    // Check if the disbursement has any feedback error.
    const hasFullTimeDisbursementFeedbackErrors =
      this.hasFullTimeDisbursementFeedbackErrors(disbursementFeedbackErrors);
    return hasFullTimeDisbursementFeedbackErrors
      ? ApplicationEventCode.DISE
      : this.eventCodeForCompletedApplicationWithAwardWithheldDueToRestriction(
          currentDisbursementScheduleId,
        );
  }

  /**
   * Checks if there is any active stop full time disbursement restriction
   * for a student.
   * @param activeRestrictionsActionTypes action types for active student restrictions.
   * @returns true if there is any active stop full time disbursement
   * restriction for a student.
   */
  private hasActiveStopFullTimeDisbursement(
    activeRestrictionsActionTypes?: RestrictionActionType[][],
  ): boolean {
    return activeRestrictionsActionTypes?.some((actionType) =>
      actionType?.includes(RestrictionActionType.StopFullTimeDisbursement),
    );
  }

  /**
   * Get application event code for an application with completed status
   * with pending disbursement and completed COE.
   * @param disbursementDate disbursement date.
   * @param activeRestrictionsActionTypes action types for active student restrictions.
   * @returns application event code.
   */
  private eventCodeForCompletedApplicationWithPendingDisbursementAndCompletedCOE(
    disbursementDate: string,
    activeRestrictionsActionTypes?: RestrictionActionType[][],
  ): ApplicationEventCode.DISR | ApplicationEventCode.COEA {
    // Check if disbursement is not sent due to restriction.
    if (
      isSameOrAfterDate(
        disbursementDate,
        addDays(DISBURSEMENT_FILE_GENERATION_ANTICIPATION_DAYS),
      )
    ) {
      const hasActiveStopFullTimeDisbursement =
        this.hasActiveStopFullTimeDisbursement(activeRestrictionsActionTypes);
      return hasActiveStopFullTimeDisbursement
        ? ApplicationEventCode.DISR
        : ApplicationEventCode.COEA;
    }
    return ApplicationEventCode.COEA;
  }

  /**
   * Get application event code for an application with completed status
   * with pending disbursement.
   * @param currentDisbursementSchedule current disbursement schedule.
   * @param activeRestrictionsActionTypes action types for active student restrictions.
   * @returns application event code.
   */
  private eventCodeForCompletedApplicationWithPendingDisbursement(
    currentDisbursementSchedule: Pick<
      DisbursementSchedule,
      "coeStatus" | "disbursementDate"
    >,
    activeRestrictionsActionTypes?: RestrictionActionType[][],
  ): CompletedApplicationWithPendingDisbursement {
    if (currentDisbursementSchedule.coeStatus === COEStatus.completed) {
      return this.eventCodeForCompletedApplicationWithPendingDisbursementAndCompletedCOE(
        currentDisbursementSchedule.disbursementDate,
        activeRestrictionsActionTypes,
      );
    }
    // COE status required and declined will come here.
    // COE status is required - Completed applications can have second COE, waiting for confirmation
    // on original assessment and anu COE waiting for confirmation on re-assessment.
    // COE status is declined - Completed application can have a second COE declined on original assessment
    // and any COE declined on re-assessment.
    return this.applicationEventCodeDuringEnrolmentAndCompleted(
      currentDisbursementSchedule.coeStatus,
    );
  }
}
