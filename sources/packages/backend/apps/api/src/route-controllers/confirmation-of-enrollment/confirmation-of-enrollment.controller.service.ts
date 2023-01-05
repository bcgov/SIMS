import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { DisbursementSchedule, DisbursementValueType } from "@sims/sims-db";
import { getTotalDisbursementAmount } from "@sims/utilities";
import {
  COE_NOT_FOUND_MESSAGE,
  FIRST_COE_NOT_COMPLETE,
  FIRST_COE_NOT_COMPLETE_MESSAGE,
  INVALID_TUITION_REMITTANCE_AMOUNT,
  INVALID_TUITION_REMITTANCE_AMOUNT_MESSAGE,
} from "../../constants";
import {
  ApplicationService,
  DisbursementScheduleService,
} from "../../services";
import { ApiProcessError } from "../../types";
import { COE_WINDOW } from "../../utilities";
import BaseController from "../BaseController";
import { ConfirmEnrollmentOptions } from "./models/confirmation-of-enrollment.dto";

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
   * @param options Confirm COE options.
   */
  async confirmEnrollment(
    disbursementScheduleId: number,
    auditUserId: number,
    options?: ConfirmEnrollmentOptions,
  ): Promise<void> {
    // Get the disbursement and application summary for COE.
    const disbursementSchedule =
      await this.disbursementScheduleService.getDisbursementAndApplicationSummary(
        disbursementScheduleId,
        options?.locationId,
      );

    if (!disbursementSchedule) {
      throw new NotFoundException(COE_NOT_FOUND_MESSAGE);
    }

    if (
      !this.applicationService.withinValidCOEWindow(
        new Date(disbursementSchedule.disbursementDate),
      )
    ) {
      throw new UnprocessableEntityException(
        `Confirmation of Enrollment window is greater than ${COE_WINDOW} days`,
      );
    }

    // TODO: Add validation for past study period.

    const firstOutstandingDisbursement =
      await this.disbursementScheduleService.getFirstDisbursementSchedule({
        disbursementScheduleId: disbursementSchedule.id,
        onlyPendingCOE: true,
      });

    if (disbursementSchedule.id !== firstOutstandingDisbursement.id) {
      throw new UnprocessableEntityException(
        new ApiProcessError(
          FIRST_COE_NOT_COMPLETE_MESSAGE,
          FIRST_COE_NOT_COMPLETE,
        ),
      );
    }

    // If no tuition remittance is set then, it is defaulted to 0.
    // This happens when ministry confirms COE.
    const tuitionRemittanceAmount =
      options?.payload?.tuitionRemittanceAmount ?? 0;

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

    const offering = disbursementSchedule.studentAssessment.offering;
    const offeringAmount =
      offering.actualTuitionCosts + offering.programRelatedCosts;
    const maxTuitionAllowed = Math.min(offeringAmount, disbursementAmount);

    if (tuitionRemittanceAmount > maxTuitionAllowed) {
      throw new UnprocessableEntityException(
        new ApiProcessError(
          INVALID_TUITION_REMITTANCE_AMOUNT_MESSAGE,
          INVALID_TUITION_REMITTANCE_AMOUNT,
        ),
      );
    }
  }
}
