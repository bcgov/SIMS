import { EntityManager } from "typeorm";
import {
  DisbursementScheduleSharedService,
  SystemUsersService,
} from "@sims/services";
import {
  DisbursementValue,
  DisbursementOveraward,
  DisbursementOverawardOriginType,
} from "@sims/sims-db";
import { ProcessSummary } from "@sims/utilities/logger";
import { EligibleECertDisbursement } from "../../disbursement-schedule.models";
import { OverawardsBalanceHandler } from "@sims/integrations/services/disbursement-schedule/e-cert-processing-steps/overawards-balance-handlers/overawards-balance-handler";
import { Injectable } from "@nestjs/common";

/**
 * Check overaward balances and apply award credit when the student has a negative balance,
 * which means that Ministry owes money to the Student.
 */
@Injectable()
export class OverawardsBalanceCreditHandler extends OverawardsBalanceHandler {
  constructor(
    private readonly disbursementScheduleSharedService: DisbursementScheduleSharedService,
    private readonly systemUsersService: SystemUsersService,
  ) {
    super();
  }

  /**
   * Handle the overaward credit for a student.
   * The student has a negative overaward balance, which means that Ministry owns money
   * to the Student and this credit must be given back to the student by adjusting the awards
   * if some overaward was subtracted in a previous disbursement of this application.
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
    const totalDisbursedValues =
      await this.disbursementScheduleSharedService.sumDisbursedValuesPerValueCode(
        eCertDisbursement.studentId,
        eCertDisbursement.applicationNumber,
        entityManager,
      );
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
}
