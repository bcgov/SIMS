import { COEStatus, DisabilityStatus } from "@sims/sims-db";
import { ProcessSummary } from "@sims/utilities/logger";
import { EligibleECertDisbursement } from "../disbursement-schedule.models";

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
  ): boolean {
    let shouldContinue = true;
    // COE
    if (eCertDisbursement.disbursement.coeStatus !== COEStatus.completed) {
      log.info("Waiting for confirmation of enrolment to be completed.");
      shouldContinue = false;
    }
    // SIN
    if (!eCertDisbursement.hasValidSIN) {
      log.info("Student SIN is invalid or the validation is pending.");
      shouldContinue = false;
    }
    // MSFAA cancelation.
    if (eCertDisbursement.disbursement.msfaaNumber.cancelledDate) {
      log.info(`Student MSFAA associated with the disbursement is cancelled.`);
      shouldContinue = false;
    }
    // MSFAA signed.
    if (!eCertDisbursement.disbursement.msfaaNumber.dateSigned) {
      log.info(`Student MSFAA associated with the disbursement is not signed.`);
      shouldContinue = false;
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
      shouldContinue = false;
    }
    return shouldContinue;
  }
}
