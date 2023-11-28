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
  StudentRestriction,
} from "@sims/sims-db";
import { ECertProcessStep } from "./e-cert-steps-models";
import { ProcessSummary } from "@sims/utilities/logger";
import { EligibleECertDisbursement } from "../disbursement-schedule.models";

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
   * @param eCertDisbursement eligible disbursement to be potentially added to an e-Cert.
   * @param entityManager used to execute the commands in the same transaction.
   * @param log cumulative log summary.
   */
  async executeStep(
    eCertDisbursement: EligibleECertDisbursement,
    entityManager: EntityManager,
    log: ProcessSummary,
  ): Promise<boolean> {
    log.info("Checking life time maximums for BC loans.");
    for (const disbursementValue of eCertDisbursement.disbursement
      .disbursementValues) {
      if (
        disbursementValue.valueAmount &&
        disbursementValue.valueType === DisbursementValueType.BCLoan
      ) {
        await this.checkLifeTimeMaximumAndAddStudentRestriction(
          eCertDisbursement,
          disbursementValue,
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
   * @param eCertDisbursement student disbursement that is part of one e-Cert.
   * @param application application related to the disbursement.
   * @param entityManager used to execute the commands in the same transaction.
   */
  private async checkLifeTimeMaximumAndAddStudentRestriction(
    eCertDisbursement: EligibleECertDisbursement,
    disbursementValue: DisbursementValue,
    entityManager: EntityManager,
  ): Promise<void> {
    // Get totals including legacy system.
    const [totalLegacyBCSLAmount, totalDisbursedBCSLAmount] = await Promise.all(
      [
        this.sfasApplicationService.totalLegacyBCSLAmount(
          eCertDisbursement.studentId,
        ),
        this.disbursementScheduleSharedService.totalDisbursedBCSLAmount(
          eCertDisbursement.studentId,
        ),
      ],
    );
    const totalLifeTimeAmount =
      totalLegacyBCSLAmount +
      totalDisbursedBCSLAmount +
      disbursementValue.effectiveAmount;
    if (totalLifeTimeAmount >= eCertDisbursement.maxLifetimeBCLoanAmount) {
      // Amount subtracted when lifetime maximum is reached.
      const amountSubtracted =
        totalLifeTimeAmount - eCertDisbursement.maxLifetimeBCLoanAmount;
      // Ideally disbursementValue.effectiveAmount should be greater or equal to amountSubtracted.
      // The flow will not reach here if the ministry ignore the restriction for the previous
      // disbursement/application and money went out to the student, even though they reach the maximum.
      const newEffectiveAmount =
        disbursementValue.effectiveAmount - amountSubtracted;
      // Create RestrictionCode.BCLM restriction when lifetime maximum is reached/exceeded.
      const bclmRestriction =
        await this.studentRestrictionSharedService.createRestrictionToSave(
          eCertDisbursement.studentId,
          RestrictionCode.BCLM,
          this.systemUsersService.systemUser.id,
          eCertDisbursement.applicationId,
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
