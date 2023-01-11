import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { DisbursementSchedule, DisbursementValueType } from "@sims/sims-db";
import {
  getTotalDisbursementAmount,
  getUTCDateDifference,
} from "@sims/utilities";
import {
  FIRST_COE_NOT_COMPLETE,
  INVALID_TUITION_REMITTANCE_AMOUNT,
} from "../../constants";
import {
  ApplicationService,
  DisbursementScheduleService,
} from "../../services";
import { ApiProcessError } from "../../types";
import {
  COE_WINDOW,
  COE_MAX_ALLOWED_DAYS_PAST_STUDY_PERIOD,
} from "../../utilities";
import BaseController from "../BaseController";
import { ConfirmationOfEnrollmentAPIInDTO } from "./models/confirmation-of-enrollment.dto";
import { ConfirmEnrollmentOptions } from "./models/confirmation-of-enrollment.models";

@Injectable()
export class ConfirmationOfEnrollmentControllerService extends BaseController {
  constructor(
    private readonly disbursementScheduleService: DisbursementScheduleService,
    private readonly applicationService: ApplicationService,
  ) {
    super();
  }

  /**
   * Approve confirmation of enrollment(COE).
   * An application can have up to two COEs based on the disbursement schedule,
   * hence the COE approval happens twice for application with more than once disbursement.
   * Irrespective of number of COEs to be approved, application status is set to complete
   * on first COE approval.
   * @param disbursementScheduleId disbursement schedule id of COE.
   * @param auditUserId user who confirms enrollment.
   * @param payload COE confirmation information.
   * @param options Confirm COE options.
   */
  async confirmEnrollment(
    disbursementScheduleId: number,
    auditUserId: number,
    payload: ConfirmationOfEnrollmentAPIInDTO,
    options?: ConfirmEnrollmentOptions,
  ): Promise<void> {
    // Get the disbursement and application summary for COE.
    const disbursementSchedule =
      await this.disbursementScheduleService.getDisbursementAndApplicationSummary(
        disbursementScheduleId,
        options?.locationId,
      );

    if (!disbursementSchedule) {
      throw new NotFoundException(
        "Confirmation of enrollment not found or application status not valid.",
      );
    }

    if (
      !options?.allowOutsideCOEWindow &&
      !this.applicationService.withinValidCOEWindow(
        new Date(disbursementSchedule.disbursementDate),
      )
    ) {
      throw new UnprocessableEntityException(
        `Confirmation of Enrollment window is greater than ${COE_WINDOW} days`,
      );
    }

    if (
      !options?.allowPastStudyPeriod &&
      this.validateCOEStudyEndDate(
        disbursementSchedule.studentAssessment.application.currentAssessment
          .offering.studyEndDate,
      )
    ) {
      throw new UnprocessableEntityException(
        "The enrolment cannot be confirmed as the study period end date is beyond maximum allowed days.",
      );
    }

    const firstOutstandingDisbursement =
      await this.disbursementScheduleService.getFirstDisbursementScheduleByApplication(
        disbursementSchedule.studentAssessment.application.id,
        true,
      );

    if (disbursementSchedule.id !== firstOutstandingDisbursement.id) {
      throw new UnprocessableEntityException(
        new ApiProcessError(
          "First disbursement(COE) not complete. Please complete the first disbursement.",
          FIRST_COE_NOT_COMPLETE,
        ),
      );
    }

    // If no tuition remittance is set then, it is defaulted to 0.
    // This happens when ministry confirms COE.
    const tuitionRemittanceAmount = payload.tuitionRemittanceAmount ?? 0;

    // Validate tuition remittance amount.
    this.validateTuitionRemittance(
      tuitionRemittanceAmount,
      disbursementSchedule,
    );

    await this.disbursementScheduleService.updateDisbursementAndApplicationCOEApproval(
      disbursementScheduleId,
      auditUserId,
      disbursementSchedule.studentAssessment.application.id,
      disbursementSchedule.studentAssessment.application.applicationStatus,
      tuitionRemittanceAmount,
    );
  }

  /**
   * Validate Institution Users to request tuition remittance at the time
   * of confirming enrolment, not to exceed the lesser than both
   * (Actual tuition + Program related costs) and (Canada grants + Canada Loan + BC Loan).
   * @param tuitionRemittanceAmount tuition remittance submitted by institution.
   * @param disbursementSchedule disbursement schedule.
   * @throws UnprocessableEntityException.
   */
  private validateTuitionRemittance(
    tuitionRemittanceAmount: number,
    disbursementSchedule: DisbursementSchedule,
  ): void {
    // If the tuition remittance amount is set to 0, then skip validation.
    if (!tuitionRemittanceAmount) {
      return;
    }
    const disbursementAmount = getTotalDisbursementAmount(
      disbursementSchedule.disbursementValues,
      [
        DisbursementValueType.CanadaLoan,
        DisbursementValueType.BCLoan,
        DisbursementValueType.CanadaGrant,
      ],
    );

    const offering =
      disbursementSchedule.studentAssessment.application.currentAssessment
        .offering;
    const offeringAmount =
      offering.actualTuitionCosts + offering.programRelatedCosts;
    const maxTuitionAllowed = Math.min(offeringAmount, disbursementAmount);

    if (tuitionRemittanceAmount > maxTuitionAllowed) {
      throw new UnprocessableEntityException(
        new ApiProcessError(
          "Tuition amount provided should be lesser than both (Actual tuition + Program related costs) and (Canada grants + Canada Loan + BC Loan).",
          INVALID_TUITION_REMITTANCE_AMOUNT,
        ),
      );
    }
  }

  /**
   * Validates as per study period end date if an enrolment is valid for institution confirmation.
   * The date validations are performed in UTC time zone.
   * @param studyEndDate study period end date
   * @returns Flag which states if an enrolment is valid for institution confirmation.
   */
  private validateCOEStudyEndDate(studyEndDate: string | Date) {
    return (
      getUTCDateDifference(studyEndDate, new Date(), "day") >
      COE_MAX_ALLOWED_DAYS_PAST_STUDY_PERIOD
    );
  }
}
