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
import { DisbursementValue, StudentRestriction } from "@sims/sims-db";
import { ECertProcessStep } from "./e-cert-steps-models";
import { ProcessSummary } from "@sims/utilities/logger";
import { EligibleECertDisbursement } from "../disbursement-schedule.models";
import { ECertGenerationService } from "../e-cert-generation.service";
import { getRestrictionByCode } from "./e-cert-steps-utils";
import { RestrictionService } from "@sims/integrations/services";

/**
 * Check if the offering belongs to aviation credential types and add an aviation restriction
 * for the given credential type if one does not already exist.
 * By adding this restriction, it will prevent the student from being funded for the same
 * aviation credential type again in the future.
 */
@Injectable()
export class AddAviationCredentialRestrictionStep implements ECertProcessStep {
  constructor(
    private readonly restrictionService: RestrictionService,
    private readonly studentRestrictionSharedService: StudentRestrictionSharedService,
    private readonly systemUsersService: SystemUsersService,
    private readonly sfasApplicationService: SFASApplicationService,
    private readonly disbursementScheduleSharedService: DisbursementScheduleSharedService,
    private readonly eCertGenerationService: ECertGenerationService,
  ) {}

  /**
   * Check if the offering belongs to aviation credential types and add restriction for the given credential type if one does not already exist.
   * @param eCertDisbursement eligible disbursement to be potentially added to an e-Cert.
   * @param entityManager used to execute the commands in the same transaction.
   * @param log cumulative log summary.
   */
  async executeStep(
    eCertDisbursement: EligibleECertDisbursement,
    entityManager: EntityManager,
    log: ProcessSummary,
  ): Promise<boolean> {
    log.info("Checking offering for aviation credential types.");
    if (!eCertDisbursement.offering.aviationCredentialType) {
      log.info(
        "The offering does not belong to aviation credential types. Hence skipping the step.",
      );
      return true;
    }
    const aviationCredentialType =
      eCertDisbursement.offering.aviationCredentialType;
    // Get restriction that is expected for the aviation credential type.
    const aviationRestriction =
      await this.restrictionService.getRestrictionForAviationCredentialType(
        aviationCredentialType,
        { entityManager },
      );
    const isAviationRestrictionAlreadyPresent = getRestrictionByCode(
      eCertDisbursement,
      aviationRestriction.restrictionCode as RestrictionCode,
    );
    if (isAviationRestrictionAlreadyPresent) {
      log.info(
        `Student already has a ${aviationRestriction.restrictionCode} restriction for the aviation credential type ${aviationCredentialType}.`,
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
