import {
  COEStatus,
  DisabilityStatus,
  RestrictionActionType,
  StudentScholasticStandingChangeType,
} from "@sims/sims-db";
import { ProcessSummary } from "@sims/utilities/logger";
import {
  ECertFailedValidation,
  ECertFailedValidationResult,
  EligibleECertDisbursement,
} from "../disbursement-schedule.models";
import {
  getRestrictionsByActionType,
  logActiveRestrictionsBypasses,
} from "./e-cert-steps-utils";
import { RestrictedParty } from "@sims/services";

/**
 * Common e-Cert validations for full-time and part-time.
 */
export abstract class ValidateDisbursementBase {
  /**
   * Validate common requirements independently of the offering intensity.
   * @param eCertDisbursement eligible disbursement to be potentially added to an e-Cert.
   * @param log cumulative log summary.
   * @param targetValidations list of validations that should only be executed. If not provided, all validations must be executed.
   */
  protected validate(
    eCertDisbursement: EligibleECertDisbursement,
    log: ProcessSummary,
    targetValidations?: ECertFailedValidation[],
  ): ECertFailedValidationResult[] {
    const validationResults: ECertFailedValidationResult[] = [];
    // COE
    this.validateCOEStatus(
      eCertDisbursement,
      log,
      validationResults,
      targetValidations,
    );
    // SIN
    this.validateSINStatus(
      eCertDisbursement,
      log,
      validationResults,
      targetValidations,
    );
    // MSFAA cancelation.
    this.validateCancelledMSFAA(
      eCertDisbursement,
      log,
      validationResults,
      targetValidations,
    );
    // MSFAA signed.
    this.validateSignedMSFAA(
      eCertDisbursement,
      log,
      validationResults,
      targetValidations,
    );
    // Disability Status PD/PPD Verified.
    this.validateDisabilityStatus(
      eCertDisbursement,
      log,
      validationResults,
      targetValidations,
    );
    // No estimated awards amounts to be disbursed.
    this.validateEstimatedAwards(
      eCertDisbursement,
      log,
      validationResults,
      targetValidations,
    );
    // Active School Transfer or Withdraw.
    this.validateActiveSchoolTransferOrWithdraw(
      eCertDisbursement,
      log,
      validationResults,
      targetValidations,
    );
    return validationResults;
  }

  /**
   * Validate effective stop disbursement restrictions on student and institution.
   * @param eCertDisbursement eligible disbursement.
   * @param restrictionActionType restriction action type to be validated.
   * @param validationResults list of failed validations to be updated.
   * @param log cumulative log summary.
   * @param targetValidations list of validations that should only be executed. If not provided, all validations must be executed.
   */
  protected validateStopDisbursementRestriction(
    eCertDisbursement: EligibleECertDisbursement,
    restrictionActionType:
      | RestrictionActionType.StopFullTimeDisbursement
      | RestrictionActionType.StopPartTimeDisbursement,
    validationResults: ECertFailedValidationResult[],
    log: ProcessSummary,
    targetValidations?: ECertFailedValidation[],
  ): void {
    const canExecuteValidation =
      this.canExecuteValidation(
        ECertFailedValidation.HasStopDisbursementRestriction,
        targetValidations,
      ) ||
      this.canExecuteValidation(
        ECertFailedValidation.HasStopDisbursementInstitutionRestriction,
        targetValidations,
      );
    if (!canExecuteValidation) {
      return;
    }
    // Validate stop disbursement restrictions.
    const stopDisbursementRestrictions = getRestrictionsByActionType(
      eCertDisbursement,
      [restrictionActionType],
    );
    if (stopDisbursementRestrictions.length) {
      const studentRestrictions = stopDisbursementRestrictions.filter(
        (restriction) =>
          restriction.restrictedParty === RestrictedParty.Student,
      );
      const institutionRestrictions = stopDisbursementRestrictions.filter(
        (restriction) =>
          restriction.restrictedParty === RestrictedParty.Institution,
      );
      if (!studentRestrictions.length && !institutionRestrictions.length) {
        throw new Error(
          "The stop disbursement restrictions are neither student nor institution restrictions.",
        );
      }
      if (studentRestrictions.length) {
        log.info(
          `Student has an active '${restrictionActionType}' restriction and the disbursement calculation will not proceed.`,
        );

        validationResults.push({
          resultType: ECertFailedValidation.HasStopDisbursementRestriction,
          additionalInfo: {
            restrictionCodes: studentRestrictions.map(
              (restriction) => restriction.code,
            ),
          },
        });
      }
      if (institutionRestrictions.length) {
        const program = eCertDisbursement.offering.educationProgram;
        const location = eCertDisbursement.offering.institutionLocation;
        log.info(
          `Institution has an effective '${restrictionActionType}' restriction` +
            ` for program ${program.id} and location ${location.id} and the disbursement calculation will not proceed.`,
        );

        validationResults.push({
          resultType:
            ECertFailedValidation.HasStopDisbursementInstitutionRestriction,
          additionalInfo: {
            restrictionCodes: institutionRestrictions.map(
              (restriction) => restriction.code,
            ),
          },
        });
      }
    }
    logActiveRestrictionsBypasses(
      eCertDisbursement.activeRestrictionBypasses,
      log,
    );
  }

  /**
   * Validate COE status for the given disbursement.
   * @param eCertDisbursement eligible disbursement to be potentially added to an e-Cert.
   * @param log cumulative log summary.
   * @param targetValidations list of validations that should only be executed. If not provided, all validations must be executed.
   */
  private validateCOEStatus(
    eCertDisbursement: EligibleECertDisbursement,
    log: ProcessSummary,
    validationResults: ECertFailedValidationResult[],
    targetValidations?: ECertFailedValidation[],
  ): void {
    if (
      !this.canExecuteValidation(
        ECertFailedValidation.NonCompletedCOE,
        targetValidations,
      )
    ) {
      return;
    }
    if (eCertDisbursement.disbursement.coeStatus !== COEStatus.completed) {
      log.info("Waiting for confirmation of enrolment to be completed.");
      validationResults.push({
        resultType: ECertFailedValidation.NonCompletedCOE,
      });
    }
  }

  /**
   * Validate SIN status of the application student.
   * @param eCertDisbursement eligible disbursement to be potentially added to an e-Cert.
   * @param log cumulative log summary.
   * @param targetValidations list of validations that should only be executed. If not provided, all validations must be executed.
   */
  private validateSINStatus(
    eCertDisbursement: EligibleECertDisbursement,
    log: ProcessSummary,
    validationResults: ECertFailedValidationResult[],
    targetValidations?: ECertFailedValidation[],
  ): void {
    if (
      !this.canExecuteValidation(
        ECertFailedValidation.InvalidSIN,
        targetValidations,
      )
    ) {
      return;
    }
    if (!eCertDisbursement.hasValidSIN) {
      log.info("Student SIN is invalid or the validation is pending.");
      validationResults.push({ resultType: ECertFailedValidation.InvalidSIN });
    }
  }

  /**
   * Validate cancelled MSFAA for the given disbursement.
   * @param eCertDisbursement eligible disbursement to be potentially added to an e-Cert.
   * @param log cumulative log summary.
   * @param targetValidations list of validations that should only be executed. If not provided, all validations must be executed.
   */
  private validateCancelledMSFAA(
    eCertDisbursement: EligibleECertDisbursement,
    log: ProcessSummary,
    validationResults: ECertFailedValidationResult[],
    targetValidations?: ECertFailedValidation[],
  ): void {
    if (
      !this.canExecuteValidation(
        ECertFailedValidation.MSFAACanceled,
        targetValidations,
      )
    ) {
      return;
    }
    if (eCertDisbursement.disbursement.msfaaNumber?.cancelledDate) {
      log.info("Student MSFAA associated with the disbursement is cancelled.");
      validationResults.push({
        resultType: ECertFailedValidation.MSFAACanceled,
      });
    }
  }

  /**
   * Validate signed MSFAA for the given disbursement.
   * @param eCertDisbursement eligible disbursement to be potentially added to an e-Cert.
   * @param log cumulative log summary.
   * @param targetValidations list of validations that should only be executed. If not provided, all validations must be executed.
   */
  private validateSignedMSFAA(
    eCertDisbursement: EligibleECertDisbursement,
    log: ProcessSummary,
    validationResults: ECertFailedValidationResult[],
    targetValidations?: ECertFailedValidation[],
  ): void {
    if (
      !this.canExecuteValidation(
        ECertFailedValidation.MSFAANotSigned,
        targetValidations,
      )
    ) {
      return;
    }
    if (!eCertDisbursement.disbursement.msfaaNumber?.dateSigned) {
      log.info(
        "Student MSFAA associated with the disbursement is not signed or there is no MSFAA associated with the application.",
      );
      validationResults.push({
        resultType: ECertFailedValidation.MSFAANotSigned,
      });
    }
  }

  /**
   * Validate if the application disability status match with student disability status.
   * @param eCertDisbursement eligible disbursement to be potentially added to an e-Cert.
   * @param log cumulative log summary.
   * @param targetValidations list of validations that should only be executed. If not provided, all validations must be executed.
   */
  private validateDisabilityStatus(
    eCertDisbursement: EligibleECertDisbursement,
    log: ProcessSummary,
    validationResults: ECertFailedValidationResult[],
    targetValidations?: ECertFailedValidation[],
  ): void {
    if (
      !this.canExecuteValidation(
        ECertFailedValidation.DisabilityStatusNotConfirmed,
        targetValidations,
      )
    ) {
      return;
    }
    const disabilityStatusValidation = eCertDisbursement.disabilityDetails
      .calculatedPDPPDStatus
      ? [DisabilityStatus.PD, DisabilityStatus.PPD].includes(
          eCertDisbursement.disabilityDetails.studentProfileDisabilityStatus,
        )
      : true;
    if (!disabilityStatusValidation) {
      log.info(`Student disability Status PD/PPD is not verified.`);
      validationResults.push({
        resultType: ECertFailedValidation.DisabilityStatusNotConfirmed,
      });
    }
  }

  /**
   * Validate if the disbursement has estimated awards to be disbursed.
   * @param eCertDisbursement eligible disbursement to be potentially added to an e-Cert.
   * @param log cumulative log summary.
   * @param targetValidations list of validations that should only be executed. If not provided, all validations must be executed.
   */
  private validateEstimatedAwards(
    eCertDisbursement: EligibleECertDisbursement,
    log: ProcessSummary,
    validationResults: ECertFailedValidationResult[],
    targetValidations?: ECertFailedValidation[],
  ): void {
    if (
      !this.canExecuteValidation(
        ECertFailedValidation.NoEstimatedAwardAmounts,
        targetValidations,
      )
    ) {
      return;
    }
    const hasEstimatedAwards =
      eCertDisbursement.disbursement.hasEstimatedAwards;
    if (!hasEstimatedAwards) {
      log.info(
        "Disbursement estimated awards do not contain any amount to be disbursed.",
      );
      validationResults.push({
        resultType: ECertFailedValidation.NoEstimatedAwardAmounts,
      });
    }
  }

  /**
   * When a student has an active 'SchoolTransfer' or 'StudentWithdrewFromProgram' scholastic standing event on their application,
   * create an additional eCert blocker to prevent further funds from being disbursed.
   * @param eCertDisbursement eligible disbursement to be potentially added to an e-Cert.
   * @param log cumulative log summary.
   * @param targetValidations list of validations that should only be executed. If not provided, all validations must be executed.
   */
  private validateActiveSchoolTransferOrWithdraw(
    eCertDisbursement: EligibleECertDisbursement,
    log: ProcessSummary,
    validationResults: ECertFailedValidationResult[],
    targetValidations?: ECertFailedValidation[],
  ): void {
    if (
      !this.canExecuteValidation(
        ECertFailedValidation.ActiveTransferOrWithdraw,
        targetValidations,
      )
    ) {
      return;
    }
    if (
      eCertDisbursement.hasActiveStudentScholasticStanding([
        StudentScholasticStandingChangeType.SchoolTransfer,
        StudentScholasticStandingChangeType.StudentWithdrewFromProgram,
      ])
    ) {
      log.info(
        `Student application has an active scholastic standing change with change type '${StudentScholasticStandingChangeType.SchoolTransfer}' or '${StudentScholasticStandingChangeType.StudentWithdrewFromProgram}'.`,
      );
      validationResults.push({
        resultType: ECertFailedValidation.ActiveTransferOrWithdraw,
      });
    }
  }

  /**
   * Check if a specific validation can be executed based on the list of validations to execute.
   * @param validation validation to check.
   * @param targetValidations list of validations that should only be executed. If not provided, all validations must be executed.
   */
  protected canExecuteValidation(
    validation: ECertFailedValidation,
    targetValidations?: ECertFailedValidation[],
  ): boolean {
    return !targetValidations?.length || targetValidations.includes(validation);
  }
}
