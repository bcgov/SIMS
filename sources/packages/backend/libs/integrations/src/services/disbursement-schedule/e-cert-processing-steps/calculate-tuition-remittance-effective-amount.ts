import { Injectable } from "@nestjs/common";
import {
  ConfirmationOfEnrollmentService,
  MaxTuitionRemittanceTypes,
} from "@sims/services";
import { DisbursementSchedule } from "@sims/sims-db";
import { ECertProcessStep } from "./e-cert-steps-models";

@Injectable()
export class CalculateTuitionRemittanceEffectiveAmountStep
  implements ECertProcessStep
{
  constructor(
    private readonly confirmationOfEnrollmentService: ConfirmationOfEnrollmentService,
  ) {}

  /**
   * Calculate tuition remittance effective amount.
   * @param disbursements all disbursements that are part of one e-Cert.
   */
  async executeStep(
    disbursement: DisbursementSchedule,
    entityManager: EntityManager,
    log: ProcessSummary,
  ): Promise<void> {
    const maxTuitionRemittance =
      this.confirmationOfEnrollmentService.getMaxTuitionRemittance(
        disbursement.disbursementValues,
        disbursement.studentAssessment.application.currentAssessment.offering,
        MaxTuitionRemittanceTypes.Effective,
      );
    disbursement.tuitionRemittanceEffectiveAmount = Math.min(
      disbursement.tuitionRemittanceRequestedAmount,
      maxTuitionRemittance,
    );
  }
}
