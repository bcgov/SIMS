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
  executeStep(
    eCertDisbursement: EligibleECertDisbursement,
    entityManager: EntityManager,
    log: ProcessSummary,
  ): boolean {
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
    this.validateCSLPLifetimeMaximumCheckStep(
      eCertDisbursement,
      entityManager,
      log,
    );
    return shouldContinue;
  }

  /**
   * Validate if CSLP disbursed exceeded the lifetime maximums.
   * @param eCertDisbursement eligible disbursement to be potentially added to an e-Cert.
   * @param entityManager used to execute the commands in the same transaction.
   * @param log cumulative log summary.
   */
  private async validateCSLPLifetimeMaximumCheckStep(
    eCertDisbursement: EligibleECertDisbursement,
    entityManager: EntityManager,
    log: ProcessSummary,
  ) {
    log.info("Validate CSLP Lifetime Maximum.");
    //Get the disbursed value for the CSLP in the current disbursement.
    const disbursementCSLP =
      eCertDisbursement.disbursement.disbursementValues.find(
        (item) => item.valueCode === CANADA_STUDENT_LOAN_PART_TIME_AWARD_CODE,
      );
    if (!disbursementCSLP?.valueAmount) {
      return true;
    }
    // Fetch lifetime maximum of CSLP from the workflow data.
    const lifetimeMaximumsCSLPPromise =
      this.eCertGenerationService.getCSLPLifetimeMaximums(
        eCertDisbursement.assessmentId,
        entityManager,
      );
    //Get latest CSLP monthly balance.
    const latestCSLPBalancePromise =
      this.studentLoanBalanceSharedService.getLatestCSLPBalance(
        eCertDisbursement.studentId,
      );
    const [lifetimeMaximumsCSLP, latestCSLPBalance] = await Promise.all([
      lifetimeMaximumsCSLPPromise,
      latestCSLPBalancePromise,
    ]);
    //Check if lifetime maximum CSLP is less than or equal to the sum of disbursed CSLP and latest student loan balance.
    if (
      lifetimeMaximumsCSLP >=
      disbursementCSLP.valueAmount + latestCSLPBalance
    ) {
      log.info(
        "Lifetime maximum CSLP is less than or equal to the sum of disbursed CSLP and latest student loan balance",
      );
      return true;
    } else {
      log.info(
        "Lifetime maximum CSLP is reached, part time disbursement is stopped.",
      );
      return false;
    }
  }
}
