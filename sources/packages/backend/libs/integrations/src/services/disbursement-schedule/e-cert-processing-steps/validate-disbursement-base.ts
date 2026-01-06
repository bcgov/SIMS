import {
  COEStatus,
  DisabilityStatus,
  RestrictionActionType,
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
} from "@sims/integrations/services/disbursement-schedule/e-cert-processing-steps/e-cert-steps-utils";
import { RestrictedParty } from "@sims/services";

/**
 * Common e-Cert validations for full-time and part-time.
 */
export abstract class ValidateDisbursementBase {
  /**
   * Validate common requirements independently of the offering intensity.
   * @param eCertDisbursement eligible disbursement to be potentially added to an e-Cert.
   * @param log cumulative log summary.
   */
  protected validate(
    eCertDisbursement: EligibleECertDisbursement,
    log: ProcessSummary,
  ): ECertFailedValidationResult[] {
    const validationResults: ECertFailedValidationResult[] = [];
    // COE
    if (eCertDisbursement.disbursement.coeStatus !== COEStatus.completed) {
      log.info("Waiting for confirmation of enrolment to be completed.");
      validationResults.push({
        resultType: ECertFailedValidation.NonCompletedCOE,
      });
    }
    // SIN
    if (!eCertDisbursement.hasValidSIN) {
      log.info("Student SIN is invalid or the validation is pending.");
      validationResults.push({ resultType: ECertFailedValidation.InvalidSIN });
    }
    // MSFAA cancelation.
    if (eCertDisbursement.disbursement.msfaaNumber?.cancelledDate) {
      log.info("Student MSFAA associated with the disbursement is cancelled.");
      validationResults.push({
        resultType: ECertFailedValidation.MSFAACanceled,
      });
    }
    // MSFAA signed.
    if (!eCertDisbursement.disbursement.msfaaNumber?.dateSigned) {
      log.info(
        "Student MSFAA associated with the disbursement is not signed or there is no MSFAA associated with the application.",
      );
      validationResults.push({
        resultType: ECertFailedValidation.MSFAANotSigned,
      });
    }
    // Disability Status PD/PPD Verified.
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
    // No estimated awards amounts to be disbursed.
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
    return validationResults;
  }

  /**
   * Validate stop disbursement restrictions on student and institution.
   * @param eCertDisbursement eligible disbursement.
   * @param restrictionActionType restriction action type to be validated.
   * @param validationResults list of failed validations to be updated.
   * @param log cumulative log summary.
   */
  protected validateStopDisbursementRestriction(
    eCertDisbursement: EligibleECertDisbursement,
    restrictionActionType:
      | RestrictionActionType.StopFullTimeDisbursement
      | RestrictionActionType.StopPartTimeDisbursement,
    validationResults: ECertFailedValidationResult[],
    log: ProcessSummary,
  ): void {
    // Validate stop part-time disbursement restrictions.
    const stopDisbursementRestrictions = getRestrictionsByActionType(
      eCertDisbursement,
      restrictionActionType,
    );
    if (stopDisbursementRestrictions.length) {
      const isStudentRestricted = stopDisbursementRestrictions.some(
        (restriction) =>
          restriction.restrictedParty === RestrictedParty.Student,
      );
      const isInstitutionRestricted = stopDisbursementRestrictions.some(
        (restriction) =>
          restriction.restrictedParty === RestrictedParty.Institution,
      );
      if (!isStudentRestricted && !isInstitutionRestricted) {
        throw new Error(
          "The stop disbursement restricted party is neither student nor institution.",
        );
      }
      if (isStudentRestricted) {
        log.info(
          `Student has an active '${restrictionActionType}' restriction and the disbursement calculation will not proceed.`,
        );
        validationResults.push({
          resultType: ECertFailedValidation.HasStopDisbursementRestriction,
          additionalInfo: {
            restrictionCodes: stopDisbursementRestrictions.map(
              (restriction) => restriction.code,
            ),
          },
        });
      }
      if (isInstitutionRestricted) {
        const program = eCertDisbursement.offering.educationProgram;
        const location = eCertDisbursement.offering.institutionLocation;
        log.info(
          `Institution has an effective '${restrictionActionType}' restriction` +
            ` for program ${program.id} and location ${location.id} and the disbursement calculation will not proceed.`,
        );
        validationResults.push({
          resultType:
            ECertFailedValidation.HasStopDisbursementInstitutionRestriction,
        });
      }
    }
    logActiveRestrictionsBypasses(
      eCertDisbursement.activeRestrictionBypasses,
      log,
    );
  }
}
