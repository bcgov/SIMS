import { Injectable } from "@nestjs/common";
import { EntityManager } from "typeorm";
import {
  DisbursementOverawardService,
  SystemUsersService,
} from "@sims/services";
import {
  DisbursementSchedule,
  DisbursementValue,
  DisbursementOveraward,
  Student,
  DisbursementOverawardOriginType,
} from "@sims/sims-db";
import { AwardOverawardBalance } from "@sims/services/disbursement-overaward/disbursement-overaward.models";
import { LOAN_TYPES } from "@sims/services/constants";
import { shouldStopFunding } from "./e-cert-steps-utils";
import { ECertProcessStep } from "./e-cert-steps-models";
import { ProcessSummary } from "@sims/utilities/logger";

@Injectable()
export class ApplyOverawardsDeductionsStep implements ECertProcessStep {
  constructor(
    private readonly disbursementOverawardService: DisbursementOverawardService,
    private readonly systemUsersService: SystemUsersService,
  ) {}

  /**
   * Get the overawards balance consolidated per student and per loan award to
   * apply, if needed, the overawards deductions.
   * @param disbursements all disbursements that are part of one e-Cert.
   * @param entityManager used to execute the commands in the same transaction.
   */
  async executeStep(
    disbursement: DisbursementSchedule,
    entityManager: EntityManager,
    log: ProcessSummary,
  ): Promise<void> {
    log.info("Checking if overaward deductions are needed.");
    const studentId = disbursement.studentAssessment.application.student.id;
    // Get all the overawards balances for the student.
    const overawardsBalance =
      await this.disbursementOverawardService.getOverawardBalance(
        [studentId],
        entityManager,
      );
    const studentBalance = overawardsBalance[studentId];
    // Check is some deduction is needed.
    if (!studentBalance) {
      log.info("No overaward deductions are needed.");
      return;
    }
    // Apply the overawards for every student that has some balance.
    if (overawardsBalance[studentId]) {
      log.info("Found overaward deductions.");
      await this.applyOverawardsDeductions(
        studentId,
        disbursement,
        overawardsBalance[studentId],
        entityManager,
      );
    }
  }

  /**
   * For a single student, check if there is an overaward balance, updates the awards
   * with the deductions, if needed, and adjust the student overaward balance if a
   * deduction happen.
   * @param studentId student to be verified.
   * @param studentSchedule student disbursement that is part of one e-Cert.
   * @param studentsOverawardBalance overaward balance for the student.
   * @param entityManager used to execute the commands in the same transaction.
   */
  private async applyOverawardsDeductions(
    studentId: number,
    disbursement: DisbursementSchedule,
    studentOverawardBalance: AwardOverawardBalance,
    entityManager: EntityManager,
  ): Promise<void> {
    // List of loan awards with the associated disbursement schedule.
    // Filter possible awards that will not be disbursed due to a restriction.
    // If the award will not be disbursed the overaward should not be deducted
    // because the student will not be receiving any money for the award, in this
    // case the BC Loan (BCSL).
    const loanAwards = disbursement.disbursementValues.filter(
      (award) =>
        LOAN_TYPES.includes(award.valueType) &&
        !shouldStopFunding(disbursement, award),
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
          student: { id: studentId } as Student,
          studentAssessment: disbursement.studentAssessment,
          disbursementSchedule: disbursement as DisbursementSchedule,
          disbursementValueCode: loan.valueCode,
          overawardValue: loan.overawardAmountSubtracted * -1,
          originType: DisbursementOverawardOriginType.AwardDeducted,
          creator: auditUser,
        } as DisbursementOveraward);
      }
    }
  }

  /**
   * Try to deduct an overaward balance owed by the student due to some previous overaward in some
   * previous application.
   * @param awards specific loan award being adjusted (e.g CSLF, BCSL). This will contain one or
   * two entries, always from the same award, from where the student debit will be deducted.
   * The debit will try to be settle as much as possible with the first award. If it is not enough
   * if will check for the second award (second disbursement), when present.
   * The awards lists will be always from the same loan award code. For instance, the list list
   * will contain one or two awards of type CSLF.
   * @param overawardBalance total overaward balance be deducted.
   */
  private subtractOverawardBalance(
    award: DisbursementValue,
    overawardBalance: number,
  ): void {
    let currentBalance = overawardBalance;
    // Award amount that is available to be taken for the overaward balance adjustment.
    const availableAwardValueAmount =
      award.valueAmount - (award.disbursedAmountSubtracted ?? 0);
    if (availableAwardValueAmount >= currentBalance) {
      // Current disbursement value is enough to pay the debit.
      // For instance:
      // - Award: $1000
      // - Overaward balance: $750
      // Then
      // - Award: $1000
      // - overawardAmountSubtracted: $750
      // - currentBalance: $0
      award.overawardAmountSubtracted = currentBalance;
      // Cancel because there is nothing else to be deducted.
      return;
    } else {
      // Current disbursement is not enough to pay the debit.
      // Updates total overawardBalance.
      // For instance:
      // - Award: $500
      // - Overaward balance: $750
      // Then
      // - Award: $500
      // - overawardAmountSubtracted: $500
      // - currentBalance: $250
      // If there is one more disbursement with the same award, the $250
      // overaward balance will be taken from there, if possible executing the
      // second iteration of this for loop.
      currentBalance -= availableAwardValueAmount;
      award.overawardAmountSubtracted = availableAwardValueAmount;
    }
  }
}
