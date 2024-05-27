import { RestrictionActionType } from "@sims/sims-db";
import { ProcessSummary } from "@sims/utilities/logger";
import { EntityManager } from "typeorm";
import { ECertProcessStep, ValidateDisbursementBase } from ".";
import { Injectable } from "@nestjs/common";
import { EligibleECertDisbursement } from "../disbursement-schedule.models";
import { getRestrictionByActionType } from "./e-cert-steps-utils";
import { CANADA_STUDENT_LOAN_PART_TIME_AWARD_CODE } from "@sims/services/constants";
import { ECertGenerationService } from "../e-cert-generation.service";
import { StudentLoanBalanceSharedService } from "@sims/services";
import { DisbursementEligibilityValidation } from "@sims/integrations/services/disbursement-schedule/disbursement-eligibility-validation";

/**
 * Specific e-Cert validations for part-time.
 */
@Injectable()
export class ValidateDisbursementPartTimeStep
  extends ValidateDisbursementBase
  implements ECertProcessStep
{
  constructor(
    private readonly eCertGenerationService: ECertGenerationService,
    private readonly studentLoanBalanceSharedService: StudentLoanBalanceSharedService,
  ) {
    super();
  }
  /**
   * Validate part-time disbursements.
   * @param eCertDisbursement eligible disbursement to be potentially added to an e-Cert.
   * @param entityManager used to execute the commands in the same transaction.
   * @param log cumulative log summary.
   */
  async executeStep(
    eCertDisbursement: EligibleECertDisbursement,
    entityManager: EntityManager,
    log: ProcessSummary,
  ): Promise<boolean> {
    log.info("Executing part-time disbursement validations.");
    let shouldContinue = super.validate(eCertDisbursement, log);
    // Validate stop part-time disbursement restrictions.
    const stopPartTimeDisbursement = getRestrictionByActionType(
      eCertDisbursement,
      RestrictionActionType.StopPartTimeDisbursement,
    );
    if (stopPartTimeDisbursement) {
      log.info(
        `Student has an active '${RestrictionActionType.StopPartTimeDisbursement}' restriction and the disbursement calculation will not proceed.`,
      );
      shouldContinue = false;
    }
    const validateLifetimeMaximumCSLP = await this.validateCSLPLifetimeMaximum(
      eCertDisbursement,
      entityManager,
      log,
    );
    if (!validateLifetimeMaximumCSLP) {
      shouldContinue = false;
    }
    return shouldContinue;
  }

  /**
   * Validate if CSLP disbursed exceeded the lifetime maximums.
   * @param eCertDisbursement eligible disbursement to be potentially added to an e-Cert.
   * @param entityManager used to execute the commands in the same transaction.
   * @param log cumulative log summary.
   */
  private async validateCSLPLifetimeMaximum(
    eCertDisbursement: EligibleECertDisbursement,
    entityManager: EntityManager,
    log: ProcessSummary,
  ) {
    log.info("Validate CSLP Lifetime Maximum.");
    // Get the disbursed value for the CSLP in the current disbursement.
    const disbursementCSLP =
      eCertDisbursement.disbursement.disbursementValues.find(
        (item) => item.valueCode === CANADA_STUDENT_LOAN_PART_TIME_AWARD_CODE,
      );
    if (!disbursementCSLP?.valueAmount) {
      return true;
    }

    const disbursementValidation = new DisbursementEligibilityValidation(
      this.eCertGenerationService,
      this.studentLoanBalanceSharedService,
      eCertDisbursement.disbursement,
      null,
      eCertDisbursement,
    );

    const hasValidDisbursement =
      disbursementValidation.validateCSLPDisbursement(
        CANADA_STUDENT_LOAN_PART_TIME_AWARD_CODE,
        entityManager,
      );

    // Check if lifetime maximum CSLP is less than or equal to the sum of disbursed CSLP and latest student loan balance.
    if (hasValidDisbursement) {
      log.info(
        "Lifetime maximum CSLP is greater than or equal to the sum of disbursed CSLP and latest student loan balance.",
      );
      return true;
    }
    log.info(
      "Lifetime maximum CSLP is reached, part time disbursement is stopped.",
    );
    return false;
  }
}
