import { COEStatus, DisbursementSchedule } from "@sims/sims-db";
import { ProcessSummary } from "@sims/utilities/logger";

export abstract class ValidateDisbursementBase {
  /**
   * Validate common requirements independently of the offering intensity.
   * @param disbursement disbursement with the BC grants to be calculated.
   * @param log cumulative log summary.
   */
  protected validate(
    disbursement: DisbursementSchedule,
    log: ProcessSummary,
  ): boolean {
    let shouldContinue = true;
    // COE
    if (disbursement.coeStatus !== COEStatus.completed) {
      log.info(
        `Confirmation of Enrollment is not in the correct status. Current '${disbursement.coeStatus}', expected '${COEStatus.completed}'.`,
      );
      shouldContinue = false;
    }
    // SIN
    if (
      !disbursement.studentAssessment.application.student.sinValidation
        .isValidSIN
    ) {
      log.info(`Student SIN is invalid or the validation is pending.`);
      shouldContinue = false;
    }
    // MSFAA cancelation.
    if (disbursement.msfaaNumber.cancelledDate) {
      log.info(`Student MSFAA associated with the disbursement is cancelled.`);
      shouldContinue = false;
    }
    // MSFAA signed.
    if (!disbursement.msfaaNumber.dateSigned) {
      log.info(`Student MSFAA associated with the disbursement is not signed.`);
      shouldContinue = false;
    }
    return shouldContinue;
  }
}
