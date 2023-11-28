import { Injectable } from "@nestjs/common";
import { EntityManager } from "typeorm";
import {
  DisbursementOverawardService,
  SystemUsersService,
} from "@sims/services";
import {
  DisbursementValue,
  DisbursementOveraward,
  DisbursementOverawardOriginType,
} from "@sims/sims-db";
import { AwardOverawardBalance } from "@sims/services/disbursement-overaward/disbursement-overaward.models";
import { LOAN_TYPES } from "@sims/services/constants";
import { ECertProcessStep } from "./e-cert-steps-models";
import { ProcessSummary } from "@sims/utilities/logger";
import { EligibleECertDisbursement } from "../disbursement-schedule.models";
import { shouldStopBCFunding } from "./e-cert-steps-utils";

/**
 * Check overaward balances and apply award deductions if needed.
 */
@Injectable()
export class ApplyOverawardsDeductionsStep implements ECertProcessStep {
  constructor(
    private readonly disbursementOverawardService: DisbursementOverawardService,
    private readonly systemUsersService: SystemUsersService,
  ) {}

  /**
   * Get the overawards balance consolidated for the disbursement student and
   * per loan award to apply, if needed, the overawards deductions.
   * @param eCertDisbursement eligible disbursement to be potentially added to an e-Cert.
   * @param entityManager used to execute the commands in the same transaction.
   * @param log cumulative log summary.
   */
  async executeStep(
    eCertDisbursement: EligibleECertDisbursement,
    entityManager: EntityManager,
    log: ProcessSummary,
  ): Promise<boolean> {
    log.info("Checking if overaward deductions are needed.");
    // Get all the overawards balances for the student.
    const overawardsBalance =
      await this.disbursementOverawardService.getOverawardBalance(
        [eCertDisbursement.studentId],
        entityManager,
      );
    const studentBalance = overawardsBalance[eCertDisbursement.studentId];
    // Check is some deduction is needed.
    if (studentBalance) {
      // Apply the overawards for every student that has some balance.
      log.info("Found overaward deductions.");
      await this.applyOverawardsDeductions(
        eCertDisbursement,
        studentBalance,
        entityManager,
      );
    } else {
      log.info("No overaward deductions are needed.");
    }
    return true;
  }

  /**
   * For a single student disbursement, check if there is an overaward balance,
   * updates the awards with the deductions (if needed), and adjust the student
   * overaward balance if a deduction happen.
   * @param eCertDisbursement eligible disbursement to be potentially added to an e-Cert.
   * @param studentsOverawardBalance overaward balance for the student.
   * @param entityManager used to execute the commands in the same transaction.
   */
  private async applyOverawardsDeductions(
    eCertDisbursement: EligibleECertDisbursement,
    studentOverawardBalance: AwardOverawardBalance,
    entityManager: EntityManager,
  ): Promise<void> {
    // List of loan awards with the associated disbursement schedule.
    // Filter possible awards that will not be disbursed due to a restriction.
    // If the award will not be disbursed the overaward should not be deducted
    // because the student will not be receiving any money for the award, in this
    // case the BC Loan (BCSL).
    const loanAwards = eCertDisbursement.disbursement.disbursementValues.filter(
      (award) =>
        LOAN_TYPES.includes(award.valueType) &&
        !shouldStopBCFunding(eCertDisbursement, award),
    );
    for (const loan of loanAwards) {
      // Total overaward balance for the student for this particular award.
      const overawardBalance = studentOverawardBalance[loan.valueCode] ?? 0;
      if (!overawardBalance) {
        // There are no overawards to be subtracted for this award.
        continue;
      }
      // Subtract the debit from the current awards in the current assessment.
      this.subtractOverawardBalance(loan, overawardBalance);
      // Prepare to update the overaward balance with any deduction
      // that was applied to any award on the method subtractOverawardBalance.
      const disbursementOverawardRepo = entityManager.getRepository(
        DisbursementOveraward,
      );
      const auditUser = await this.systemUsersService.systemUser();
      if (loan.overawardAmountSubtracted) {
        // An overaward was subtracted from an award and the same must be
        // deducted from the student balance.
        await disbursementOverawardRepo.insert({
          student: { id: eCertDisbursement.studentId },
          studentAssessment: { id: eCertDisbursement.assessmentId },
          disbursementSchedule: eCertDisbursement.disbursement,
          disbursementValueCode: loan.valueCode,
          overawardValue: loan.overawardAmountSubtracted * -1,
          originType: DisbursementOverawardOriginType.AwardDeducted,
          creator: auditUser,
        } as DisbursementOveraward);
      }
    }
  }

  /**
   * Try to deduct an overaward balance owed by the student due to some previous
   * overaward from some previous application.
   * @param award specific loan award being adjusted (e.g CSLF, BCSL).
   * @param overawardBalance total overaward balance be deducted.
   */
  private subtractOverawardBalance(
    award: DisbursementValue,
    overawardBalance: number,
  ): void {
    // Award amount that is available to be taken for the overaward balance adjustment.
    const availableAwardValueAmount =
      award.valueAmount - (award.disbursedAmountSubtracted ?? 0);
    if (availableAwardValueAmount >= overawardBalance) {
      // Current disbursement value is enough to pay the debit.
      // For instance:
      // - Award: $1000
      // - Overaward balance: $750
      // Then
      // - Award: $1000
      // - overawardAmountSubtracted: $750
      // - current balance: $0
      award.overawardAmountSubtracted = overawardBalance;
      return;
    }
    // Current disbursement is not enough to pay the debit.
    // Updates total overawardBalance.
    // For instance:
    // - Award: $500
    // - Overaward balance: $750
    // Then
    // - Award: $500
    // - overawardAmountSubtracted: $500
    // - current balance: $250
    award.overawardAmountSubtracted = availableAwardValueAmount;
  }
}
