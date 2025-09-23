import { COEStatus, DisabilityStatus } from "@sims/sims-db";
import { ProcessSummary } from "@sims/utilities/logger";
import {
  ECertFailedValidation,
  ECertFailedValidationResult,
  EligibleECertDisbursement,
} from "../disbursement-schedule.models";

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
}
