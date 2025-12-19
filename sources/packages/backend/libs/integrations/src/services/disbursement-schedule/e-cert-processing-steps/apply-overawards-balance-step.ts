import { Injectable } from "@nestjs/common";
import { EntityManager } from "typeorm";
import {
  DisbursementOverawardService,
  DisbursementScheduleSharedService,
  SystemUsersService,
  TotalDisbursedAwards,
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
 * Check overaward balances and apply award credit or deduction if needed.
 */
@Injectable()
export class ApplyOverawardsBalanceStep implements ECertProcessStep {
  constructor(
    private readonly disbursementOverawardService: DisbursementOverawardService,
    private readonly disbursementScheduleSharedService: DisbursementScheduleSharedService,
    private readonly systemUsersService: SystemUsersService,
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
    let totalDisbursedValues: TotalDisbursedAwards | null = null;
    for (const loan of loanAwards) {
      // Total overaward balance for the student for this particular award.
      const overawardBalance = studentOverawardBalance[loan.valueCode] ?? 0;
      if (!overawardBalance) {
        // There are no overawards to be subtracted for this award.
        log.info(`No overaward adjustments needed for ${loan.valueCode}.`);
        continue;
      }
      if (overawardBalance < 0) {
        if (!totalDisbursedValues) {
          // Ensure to get the total disbursed values only once per disbursement,
          // since all awards can be retrieved from the same query.
          totalDisbursedValues =
            await this.disbursementScheduleSharedService.sumDisbursedValuesPerValueCode(
              eCertDisbursement.studentId,
              eCertDisbursement.applicationNumber,
              entityManager,
            );
        }
        await this.handleStudentOverawardCredit(
          eCertDisbursement,
          totalDisbursedValues,
          loan,
          overawardBalance,
          entityManager,
          log,
        );
        continue;
      }

      await this.handleStudentOverawardDebit(
        eCertDisbursement,
        loan,
        overawardBalance,
        entityManager,
        log,
      );
    }
  }

  /**
   * Handle the overaward credit for a student.
   * The student has a negative overaward balance, which means that Ministry owns money
   * to the Student and this credit must be given back to the student by adjusting the awards
   * if some overaward was subtracted in a previous disbursement of this application.
   * @param eCertDisbursement eligible disbursement to be potentially added to an e-Cert.
   * @param totalDisbursedValues total disbursed values per value code for the application.
   * @param loan specific loan award being adjusted (e.g CSLF, BCSL).
   * @param overawardBalance total overaward balance be deducted.
   * @param entityManager used to execute the commands in the same transaction.
   * @param log cumulative log summary.
   */
  private async handleStudentOverawardCredit(
    eCertDisbursement: EligibleECertDisbursement,
    totalDisbursedValues: TotalDisbursedAwards,
    loan: DisbursementValue,
    overawardBalance: number,
    entityManager: EntityManager,
    log: ProcessSummary,
  ): Promise<void> {
    const disbursedValue = totalDisbursedValues[loan.valueCode];
    if (!disbursedValue?.overawardAmount) {
      // No overaward was subtracted for this award in previous disbursements
      // of this application, so no credit can be applied.
      log.info(
        `An overaward credit was found, but there are no overawards deductions in previous disbursements for ${loan.valueCode}.`,
      );
      return;
    }
    log.info(`Applying overaward credit for ${loan.valueCode}.`);
    // The award had some overaward subtracted in a previous disbursement of this application.
    // Calculate how much can be credited back to the student.
    const availableCreditAmount = Math.min(
      disbursedValue.overawardAmount,
      Math.abs(overawardBalance),
    );
    if (!availableCreditAmount) {
      // No credit can be applied.
      return;
    }
    // Adjust the loan award by crediting back the overaward amount.
    loan.overawardAmountSubtracted = -availableCreditAmount;
    // Update the student overaward balance with the credit applied.
    const disbursementOverawardRepo = entityManager.getRepository(
      DisbursementOveraward,
    );
    await disbursementOverawardRepo.insert({
      student: { id: eCertDisbursement.studentId },
      studentAssessment: { id: eCertDisbursement.assessmentId },
      disbursementSchedule: eCertDisbursement.disbursement,
      disbursementValueCode: loan.valueCode,
      overawardValue: availableCreditAmount,
      originType: DisbursementOverawardOriginType.AwardCredited,
      creator: this.systemUsersService.systemUser,
    } as DisbursementOveraward);
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
  private async handleStudentOverawardDebit(
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
