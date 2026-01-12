import { Injectable } from "@nestjs/common";
import { EntityManager } from "typeorm";
import {
  DisbursementOverawardService,
  AwardOverawardBalance,
} from "@sims/services";
import { LOAN_TYPES } from "@sims/services/constants";
import { ECertProcessStep } from "./e-cert-steps-models";
import { ProcessSummary } from "@sims/utilities/logger";
import { EligibleECertDisbursement } from "../disbursement-schedule.models";
import { getStopFundingTypesAndRestrictionsMap } from "./e-cert-steps-utils";
import {
  OverawardsBalanceCreditHandler,
  OverawardsBalanceDebitHandler,
} from "@sims/integrations/services/disbursement-schedule/e-cert-processing-steps";

/**
 * Check overaward balances and apply award credit or deduction if needed.
 */
@Injectable()
export class ApplyOverawardsBalanceStep implements ECertProcessStep {
  constructor(
    private readonly disbursementOverawardService: DisbursementOverawardService,
    private readonly overawardsBalanceCreditHandler: OverawardsBalanceCreditHandler,
    private readonly overawardsBalanceDebitHandler: OverawardsBalanceDebitHandler,
  ) {}

  /**
   * Get the overawards balance consolidated for the disbursement student and
   * per loan award to apply, if needed, the overawards credits or deductions.
   * @param eCertDisbursement eligible disbursement to be potentially added to an e-Cert.
   * @param entityManager used to execute the commands in the same transaction.
   * @param log cumulative log summary.
   */
  async executeStep(
    eCertDisbursement: EligibleECertDisbursement,
    entityManager: EntityManager,
    log: ProcessSummary,
  ): Promise<boolean> {
    log.info("Checking if overaward adjustments are needed.");
    // Get all the overawards balances for the student.
    const overawardsBalance =
      await this.disbursementOverawardService.getOverawardBalance(
        [eCertDisbursement.studentId],
        entityManager,
      );
    const studentBalance = overawardsBalance[eCertDisbursement.studentId];
    // Check is some adjustment is needed.
    if (studentBalance) {
      // Adjust the overawards for every student that has some balance (positive or negative).
      log.info("Found overaward balance for the student.");
      await this.adjustOverawards(
        eCertDisbursement,
        studentBalance,
        entityManager,
        log,
      );
    } else {
      log.info("No overaward adjustments are needed.");
    }
    return true;
  }

  /**
   * For a single student disbursement, check if there is an overaward balance (positive or negative)
   * and updates the awards with the credits or deductions (if needed), and adjust the student
   * overaward balance.
   * @param eCertDisbursement eligible disbursement to be potentially added to an e-Cert.
   * @param studentOverawardBalance overaward balance for the student.
   * @param entityManager used to execute the commands in the same transaction.
   * @param log cumulative log summary.
   */
  private async adjustOverawards(
    eCertDisbursement: EligibleECertDisbursement,
    studentOverawardBalance: AwardOverawardBalance,
    entityManager: EntityManager,
    log: ProcessSummary,
  ): Promise<void> {
    const stopFundingMap =
      getStopFundingTypesAndRestrictionsMap(eCertDisbursement);
    // List of loan awards with the associated disbursement schedule.
    // Filter possible awards that will not be disbursed due to a restriction.
    // If the award will not be disbursed the overaward should not be deducted
    // because the student will not be receiving any money for the award, in this
    // case the BC Loan (BCSL).
    const loanAwards = eCertDisbursement.disbursement.disbursementValues.filter(
      (award) =>
        LOAN_TYPES.includes(award.valueType) &&
        !stopFundingMap.has(award.valueType),
    );
    for (const loan of loanAwards) {
      // Total overaward balance for the student for this particular award.
      const overawardBalance = studentOverawardBalance[loan.valueCode] ?? 0;
      if (!overawardBalance) {
        // There are no overawards to be subtracted for this award.
        log.info(`No overaward adjustments needed for ${loan.valueCode}.`);
        continue;
      }
      const overawardsBalanceHandler =
        overawardBalance < 0
          ? this.overawardsBalanceCreditHandler
          : this.overawardsBalanceDebitHandler;
      await overawardsBalanceHandler.process(
        eCertDisbursement,
        loan,
        overawardBalance,
        entityManager,
        log,
      );
    }
  }
}
