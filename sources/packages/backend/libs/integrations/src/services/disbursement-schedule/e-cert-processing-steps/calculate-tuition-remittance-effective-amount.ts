import { Injectable } from "@nestjs/common";
import {
  ConfirmationOfEnrollmentService,
  MaxTuitionRemittanceTypes,
} from "@sims/services";
import { DisbursementSchedule } from "@sims/sims-db";
import { ECertProcessStep } from "./e-cert-steps-models";
import { ProcessSummary } from "@sims/utilities/logger";
import { EntityManager } from "typeorm";

@Injectable()
export class CalculateTuitionRemittanceEffectiveAmountStep
  implements ECertProcessStep
{
  constructor(
    private readonly confirmationOfEnrollmentService: ConfirmationOfEnrollmentService,
  ) {}

  /**
   * Calculate tuition remittance effective amount.
   * @param disbursement all disbursements that are part of one e-Cert.
   * @param _entityManager not used.
   * @param log cumulative log summary.
   */
  async executeStep(
    disbursement: DisbursementSchedule,
    _entityManager: EntityManager,
    log: ProcessSummary,
  ): Promise<boolean> {
    log.info("Checking the limit for the tuition remittance.");
    const maxTuitionRemittance =
      this.confirmationOfEnrollmentService.getMaxTuitionRemittance(
        disbursement.disbursementValues,
        disbursement.studentAssessment.application.currentAssessment.offering,
        MaxTuitionRemittanceTypes.Effective,
      );
    if (disbursement.tuitionRemittanceRequestedAmount > maxTuitionRemittance) {
      disbursement.tuitionRemittanceEffectiveAmount = maxTuitionRemittance;
      log.info(
        `The tuition remittance was adjusted because exceeded the maximum allowed of ${maxTuitionRemittance}.`,
      );
      return;
    }
    disbursement.tuitionRemittanceEffectiveAmount =
      disbursement.tuitionRemittanceRequestedAmount;
    log.info("No tuition remittance adjustment was needed.");
    return true;
  }
}
