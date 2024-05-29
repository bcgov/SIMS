import { COEStatus, DisabilityStatus } from "@sims/sims-db";
import { ProcessSummary } from "@sims/utilities/logger";
import {
  ECertFailedValidation,
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
  ): ECertFailedValidation[] {
    const validationResults: ECertFailedValidation[] = [];
    // COE
    if (eCertDisbursement.disbursement.coeStatus !== COEStatus.completed) {
      log.info("Waiting for confirmation of enrolment to be completed.");
      validationResults.push(ECertFailedValidation.NonCompletedCOE);
    }
    // SIN
    if (!eCertDisbursement.hasValidSIN) {
      log.info("Student SIN is invalid or the validation is pending.");
      validationResults.push(ECertFailedValidation.InvalidSIN);
    }
    // MSFAA cancelation.
    if (eCertDisbursement.disbursement.msfaaNumber.cancelledDate) {
      log.info(`Student MSFAA associated with the disbursement is cancelled.`);
      validationResults.push(ECertFailedValidation.MSFAACanceled);
    }
    // MSFAA signed.
    if (!eCertDisbursement.disbursement.msfaaNumber.dateSigned) {
      log.info(`Student MSFAA associated with the disbursement is not signed.`);
      validationResults.push(ECertFailedValidation.MSFAANotSigned);
    }
    // MSFAA invalid.
    if (
      eCertDisbursement.disbursement.msfaaNumber.cancelledDate ||
      !eCertDisbursement.disbursement.msfaaNumber.dateSigned
    ) {
      log.info(`Student MSFAA associated with the disbursement is not valid.`);
      validationResults.push(ECertFailedValidation.MSFAANotValid);
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
      validationResults.push(
        ECertFailedValidation.DisabilityStatusNotConfirmed,
      );
    }
    return validationResults;
  }
}
