import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { ConfirmationOfEnrollmentService } from "@sims/services";
import { DisbursementSchedule } from "@sims/sims-db";
import {
  FIRST_COE_NOT_COMPLETE,
  INVALID_TUITION_REMITTANCE_AMOUNT,
} from "../../constants";
import { DisbursementScheduleService } from "../../services";
import { COEApprovalPeriodStatus } from "../../services/disbursement-schedule/disbursement-schedule.models";
import { ApiProcessError } from "../../types";
import BaseController from "../BaseController";
import { ConfirmationOfEnrollmentAPIInDTO } from "./models/confirmation-of-enrollment.dto";
import { ConfirmEnrollmentOptions } from "./models/confirmation-of-enrollment.models";

@Injectable()
export class ConfirmationOfEnrollmentControllerService extends BaseController {
  constructor(
    private readonly disbursementScheduleService: DisbursementScheduleService,
    private readonly confirmationOfEnrollmentService: ConfirmationOfEnrollmentService,
  ) {
    super();
  }

  /**
   * Approve confirmation of enrollment(COE).
   * An application can have up to two COEs based on the disbursement schedule,
   * hence the COE approval happens twice for application with more than once disbursement.
   * Irrespective of number of COEs to be approved, application status is set to complete
   * on first COE approval.
   * TODO:To be moved.
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

    if (!options?.allowOutsideCOEApprovalPeriod) {
      const approvalPeriodStatus =
        this.disbursementScheduleService.getCOEApprovalPeriodStatus(
          disbursementSchedule.disbursementDate,
          disbursementSchedule.studentAssessment.application.currentAssessment
            .offering.studyEndDate,
        );
      if (
        approvalPeriodStatus !== COEApprovalPeriodStatus.WithinApprovalPeriod
      ) {
        throw new UnprocessableEntityException(
          "The enrolment cannot be confirmed as current date is not within the valid approval period.",
        );
      }
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
    await this.validateTuitionRemittance(
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
  private async validateTuitionRemittance(
    tuitionRemittanceAmount: number,
    disbursementSchedule: DisbursementSchedule,
  ): Promise<void> {
    // If the tuition remittance amount is set to 0, then skip validation.
    if (!tuitionRemittanceAmount) {
      return;
    }

    const maxTuitionAllowed =
      await this.confirmationOfEnrollmentService.getEstimatedMaxTuitionRemittance(
        disbursementSchedule.id,
      );

    if (tuitionRemittanceAmount > maxTuitionAllowed) {
      throw new UnprocessableEntityException(
        new ApiProcessError(
          "Tuition amount provided should be lesser than both (Actual tuition + Program related costs) and (Canada grants + Canada Loan + BC Loan).",
          INVALID_TUITION_REMITTANCE_AMOUNT,
        ),
      );
    }
  }
}
