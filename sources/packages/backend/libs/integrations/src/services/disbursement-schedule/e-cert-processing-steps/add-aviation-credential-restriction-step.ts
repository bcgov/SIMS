import { Injectable } from "@nestjs/common";
import { EntityManager } from "typeorm";
import {
  RestrictionCode,
  StudentRestrictionSharedService,
  SystemUsersService,
} from "@sims/services";
import { StudentRestriction } from "@sims/sims-db";
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
    log.info(
      "Checking offering for aviation credential types to add a restriction.",
    );
    if (!eCertDisbursement.offering.aviationCredentialType) {
      log.info(
        "The offering does not belong to aviation credential types. Hence skipping the step.",
      );
      return true;
    }
    const aviationCredentialType =
      eCertDisbursement.offering.aviationCredentialType;
    // Get restriction that is applicable for the given aviation credential type.
    const aviationRestriction =
      await this.restrictionService.getRestrictionForAviationCredentialType(
        aviationCredentialType,
        { entityManager },
      );
    const isAviationRestrictionAlreadyPresent = getRestrictionByCode(
      eCertDisbursement,
      aviationRestriction.restrictionCode as RestrictionCode,
    );
    // If the aviation restriction for the given credential type is already present, do not add a new restriction.
    if (isAviationRestrictionAlreadyPresent) {
      log.info(
        `Student already has a ${aviationRestriction.restrictionCode} restriction for the aviation credential type ${aviationCredentialType}.`,
      );
      return true;
    }
    const aviationStudentRestriction =
      this.studentRestrictionSharedService.buildStudentRestriction(
        eCertDisbursement.studentId,
        aviationRestriction.id,
        this.systemUsersService.systemUser.id,
        { applicationId: eCertDisbursement.applicationId },
      );
    await entityManager
      .getRepository(StudentRestriction)
      .save(aviationStudentRestriction);
    // If a new restriction was created refresh the active restrictions list.
    const activeRestrictions =
      await this.eCertGenerationService.getStudentActiveRestrictions(
        eCertDisbursement.studentId,
        entityManager,
      );
    eCertDisbursement.refreshActiveStudentRestrictions(activeRestrictions);
    log.info(
      `New restriction ${aviationRestriction.restrictionCode} for the aviation credential type ${aviationCredentialType} was added.`,
    );
    return true;
  }
}
