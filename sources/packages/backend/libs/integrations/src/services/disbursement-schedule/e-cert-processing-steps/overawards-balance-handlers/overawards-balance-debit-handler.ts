import { Injectable } from "@nestjs/common";
import { EntityManager } from "typeorm";
import { SystemUsersService } from "@sims/services";
import {
  DisbursementValue,
  DisbursementOveraward,
  DisbursementOverawardOriginType,
} from "@sims/sims-db";
import { ProcessSummary } from "@sims/utilities/logger";
import { EligibleECertDisbursement } from "../../disbursement-schedule.models";
import { OverawardsBalanceHandler } from "@sims/integrations/services/disbursement-schedule/e-cert-processing-steps/overawards-balance-handlers/overawards-balance-handler";

/**
 * Check overaward balances and apply award debit when the student has a positive balance,
 * which means that the Student owes money to the Ministry.
 */
@Injectable()
export class OverawardsBalanceDebitHandler extends OverawardsBalanceHandler {
  constructor(private readonly systemUsersService: SystemUsersService) {
    super();
  }

  /**
   * Handle the overaward debit for a student.
   * The student has a positive overaward balance, which means that he owns money
   * to the Ministry and this debit must be repaid by deducting it
   * from the current award.
   * @param eCertDisbursement eligible disbursement to be potentially added to an e-Cert.
   * @param loan specific loan award being adjusted (e.g CSLF, BCSL).
   * @param overawardBalance total overaward balance be deducted.
   * @param entityManager used to execute the commands in the same transaction.
   * @param log cumulative log summary.
   */
  async process(
    eCertDisbursement: EligibleECertDisbursement,
    loan: DisbursementValue,
    overawardBalance: number,
    entityManager: EntityManager,
    log: ProcessSummary,
  ): Promise<void> {
    log.info(`Applying overaward debit for ${loan.valueCode}.`);
    // Subtract the debit from the current awards in the current assessment.
    this.subtractOverawardBalance(loan, overawardBalance);
    if (loan.overawardAmountSubtracted) {
      // Prepare to update the overaward balance with any deduction
      // that was applied to any award on the method subtractOverawardBalance.
      const disbursementOverawardRepo = entityManager.getRepository(
        DisbursementOveraward,
      );
      // An overaward was subtracted from an award and the same must be
      // deducted from the student balance.
      await disbursementOverawardRepo.insert({
        student: { id: eCertDisbursement.studentId },
        studentAssessment: { id: eCertDisbursement.assessmentId },
        disbursementSchedule: eCertDisbursement.disbursement,
        disbursementValueCode: loan.valueCode,
        overawardValue: loan.overawardAmountSubtracted * -1,
        originType: DisbursementOverawardOriginType.AwardDeducted,
        creator: this.systemUsersService.systemUser,
      } as DisbursementOveraward);
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
