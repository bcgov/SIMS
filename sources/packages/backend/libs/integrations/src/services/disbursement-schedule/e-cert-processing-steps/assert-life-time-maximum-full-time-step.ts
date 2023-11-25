import { Injectable } from "@nestjs/common";
import { round } from "@sims/utilities";
import { EntityManager } from "typeorm";
import {
  DisbursementScheduleSharedService,
  RestrictionCode,
  SFASApplicationService,
  StudentRestrictionSharedService,
  SystemUsersService,
} from "@sims/services";
import {
  DisbursementValue,
  DisbursementValueType,
  Application,
  StudentRestriction,
  DisbursementSchedule,
} from "@sims/sims-db";
import { ECertProcessStep } from "./e-cert-steps-models";
import { ProcessSummary } from "@sims/utilities/logger";

/**
 * Check if the student is reaching the full-time BCSL maximum.
 */
@Injectable()
export class AssertLifeTimeMaximumFullTimeStep implements ECertProcessStep {
  constructor(
    private readonly studentRestrictionSharedService: StudentRestrictionSharedService,
    private readonly systemUsersService: SystemUsersService,
    private readonly sfasApplicationService: SFASApplicationService,
    private readonly disbursementScheduleSharedService: DisbursementScheduleSharedService,
  ) {}

  /**
   * Check if BCSL is part of the disbursement and ensure that, if BCSL maximum is reached,
   * the award will be adjusted and a restriction will be created.
   * @param disbursement eligible disbursement to be potentially added to an e-Cert.
   * @param entityManager used to execute the commands in the same transaction.
   * @param log cumulative log summary.
   */
  async executeStep(
    disbursement: DisbursementSchedule,
    entityManager: EntityManager,
    log: ProcessSummary,
  ): Promise<boolean> {
    log.info("Checking life time maximums for BC loans.");
    const application = disbursement.studentAssessment.application;
    for (const disbursementValue of disbursement.disbursementValues) {
      if (
        disbursementValue.valueAmount &&
        disbursementValue.valueType === DisbursementValueType.BCLoan
      ) {
        await this.checkLifeTimeMaximumAndAddStudentRestriction(
          disbursementValue,
          application,
          entityManager,
        );
      }
    }
    return true;
  }

  /**
   * Check if the student hits/exceeds the life time maximum for the BCSL Award.
   * If they hits/exceeds the life time maximum, then the award is reduced so the
   * student hits the exact maximum value and the student restriction
   * {@link  RestrictionCode.BCLM} is placed for the student.
   * @param disbursementValue disbursement value.
   * @param application application related to the disbursement.
   * @param entityManager used to execute the commands in the same transaction.
   */
  private async checkLifeTimeMaximumAndAddStudentRestriction(
    disbursementValue: DisbursementValue,
    application: Application,
    entityManager: EntityManager,
  ): Promise<void> {
    const student = application.student;
    const maxLifetimeBCLoanAmount =
      application.programYear.maxLifetimeBCLoanAmount;
    // Get totals including legacy system.
    const [totalLegacyBCSLAmount, totalDisbursedBCSLAmount] = await Promise.all(
      [
        this.sfasApplicationService.totalLegacyBCSLAmount(student.id),
        this.disbursementScheduleSharedService.totalDisbursedBCSLAmount(
          student.id,
        ),
      ],
    );
    const totalLifeTimeAmount =
      totalLegacyBCSLAmount +
      totalDisbursedBCSLAmount +
      disbursementValue.effectiveAmount;
    if (totalLifeTimeAmount >= maxLifetimeBCLoanAmount) {
      const auditUser = await this.systemUsersService.systemUser();
      // Amount subtracted when lifetime maximum is reached.
      const amountSubtracted = totalLifeTimeAmount - maxLifetimeBCLoanAmount;
      // Ideally disbursementValue.effectiveAmount should be greater or equal to amountSubtracted.
      // The flow will not reach here if the ministry ignore the restriction for the previous
      // disbursement/application and money went out to the student, even though they reach the maximum.
      const newEffectiveAmount =
        disbursementValue.effectiveAmount - amountSubtracted;
      // Create RestrictionCode.BCLM restriction when lifetime maximum is reached/exceeded.
      const bclmRestriction =
        await this.studentRestrictionSharedService.createRestrictionToSave(
          student.id,
          RestrictionCode.BCLM,
          auditUser.id,
          application.id,
        );
      if (bclmRestriction) {
        await entityManager
          .getRepository(StudentRestriction)
          .save(bclmRestriction);
      }
      disbursementValue.effectiveAmount = round(newEffectiveAmount);
      disbursementValue.restrictionAmountSubtracted = amountSubtracted;
      disbursementValue.restrictionSubtracted = bclmRestriction.restriction;
    }
  }
}
