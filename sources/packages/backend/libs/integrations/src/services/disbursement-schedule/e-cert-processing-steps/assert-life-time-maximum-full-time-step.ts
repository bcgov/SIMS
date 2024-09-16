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
import { ECertGenerationService } from "../e-cert-generation.service";
import { getRestrictionByCode } from "./e-cert-steps-utils";

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
    private readonly eCertGenerationService: ECertGenerationService,
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
    // Check restriction bypasses. If a bypass is enabled for BCLM the awards
    // should not be reduced and no further verifications are needed.
    const hasBCLMBypass = eCertDisbursement.activeRestrictionBypasses.some(
      (activeBypass) => activeBypass.restrictionCode === RestrictionCode.BCLM,
    );
    if (hasBCLMBypass) {
      log.info(
        `The application has an active bypass for ${RestrictionCode.BCLM}. The verification will be ignored.`,
      );
      return true;
    }
    if (getRestrictionByCode(eCertDisbursement, RestrictionCode.BCLM)) {
      log.info(
        `Student already has a ${RestrictionCode.BCLM} restriction, hence skipping the check.`,
      );
      return true;
    }
    // Check if the BC Loan is present in the awards to be disbursed.
    const bcLoan = eCertDisbursement.disbursement.disbursementValues.find(
      (award) => award.valueType === DisbursementValueType.BCLoan,
    );
    if (!bcLoan?.valueAmount) {
      log.info(
        `${DisbursementValueType.BCLoan} award not found or there is no amount to be disbursed, hence skipping the check.`,
      );
      return true;
    }
    // Check if a new restriction should be created and award adjusted.
    const newRestrictionCreated =
      await this.checkLifeTimeMaximumAndAddStudentRestriction(
        eCertDisbursement,
        bcLoan,
        entityManager,
      );
    if (newRestrictionCreated) {
      // If a new restriction was created refresh the active restrictions list.
      const activeRestrictions =
        await this.eCertGenerationService.getStudentActiveRestrictions(
          eCertDisbursement.studentId,
          entityManager,
        );
      eCertDisbursement.refreshActiveStudentRestrictions(activeRestrictions);
      log.info(
        `New ${RestrictionCode.BCLM} restriction was added to the student account.`,
      );
    } else {
      log.info(
        `No ${RestrictionCode.BCLM} restriction was created at this time.`,
      );
    }
    return true;
  }

  /**
   * Check if the student hits/exceeds the life time maximum for the BCSL Award.
   * If they hits/exceeds the life time maximum, then the award is reduced so the
   * student hits the exact maximum value and the student restriction
   * {@link  RestrictionCode.BCLM} is placed for the student.
   * @param eCertDisbursement student disbursement that is part of one e-Cert.
   * @param disbursementValue award value to be verified.
   * @param entityManager used to execute the commands in the same transaction.
   * @returns true if a new restriction was created, otherwise false.
   */
  private async checkLifeTimeMaximumAndAddStudentRestriction(
    eCertDisbursement: EligibleECertDisbursement,
    disbursementValue: DisbursementValue,
    entityManager: EntityManager,
  ): Promise<boolean> {
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
    if (totalLifeTimeAmount < eCertDisbursement.maxLifetimeBCLoanAmount) {
      // The limit was not reached.
      return false;
    }
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
    await entityManager.getRepository(StudentRestriction).save(bclmRestriction);
    disbursementValue.effectiveAmount = round(newEffectiveAmount);
    disbursementValue.restrictionAmountSubtracted = amountSubtracted;
    disbursementValue.restrictionSubtracted = bclmRestriction.restriction;
    return true;
  }
}
