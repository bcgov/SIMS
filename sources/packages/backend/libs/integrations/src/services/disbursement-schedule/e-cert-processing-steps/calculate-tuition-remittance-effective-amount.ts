import { Injectable } from "@nestjs/common";
import {
  ConfirmationOfEnrollmentService,
  MaxTuitionRemittanceTypes,
} from "@sims/services";
import { ECertProcessStep } from "./e-cert-steps-models";
import { ProcessSummary } from "@sims/utilities/logger";
import { EntityManager } from "typeorm";
import { EligibleECertDisbursement } from "../disbursement-schedule.models";

/**
 * Ensures that tuition remittance requested by the institution
 * will not be greater then what the student would be receiving.
 * From the time that tuition remittance was requested by the institution
 * the student may have get some restriction or overaward that would impact
 * the total amount that he would be entitled to receive.
 */
@Injectable()
export class CalculateTuitionRemittanceEffectiveAmountStep
  implements ECertProcessStep
{
  constructor(
    private readonly confirmationOfEnrollmentService: ConfirmationOfEnrollmentService,
  ) {}

  /**
   * Calculate tuition remittance effective amount.
   * @param eCertDisbursement eligible disbursement to be potentially added to an e-Cert.
   * @param _entityManager not used for this step.
   * @param log cumulative log summary.
   */
  async executeStep(
    eCertDisbursement: EligibleECertDisbursement,
    _entityManager: EntityManager,
    log: ProcessSummary,
  ): Promise<boolean> {
    log.info("Checking the limit for the tuition remittance.");

    const previousTuitionRemittance =
      await this.confirmationOfEnrollmentService.getPreviousTuitionRemittance(
        eCertDisbursement.assessmentId,
        eCertDisbursement.disbursement.disbursementDate,
      );

    const maxTuitionRemittance =
      this.confirmationOfEnrollmentService.getMaxTuitionRemittance(
        eCertDisbursement.disbursement.disbursementValues,
        eCertDisbursement.offering,
        MaxTuitionRemittanceTypes.Effective,
        previousTuitionRemittance,
      );
    if (
      eCertDisbursement.disbursement.tuitionRemittanceRequestedAmount >
      maxTuitionRemittance
    ) {
      eCertDisbursement.disbursement.tuitionRemittanceEffectiveAmount =
        maxTuitionRemittance;
      log.info(
        `The tuition remittance was adjusted because exceeded the maximum allowed of ${maxTuitionRemittance}.`,
      );
    } else {
      eCertDisbursement.disbursement.tuitionRemittanceEffectiveAmount =
        eCertDisbursement.disbursement.tuitionRemittanceRequestedAmount;
      log.info("No tuition remittance adjustment was needed.");
    }
    return true;
  }
}
