import { EntityManager } from "typeorm";
import { DisbursementValue } from "@sims/sims-db";
import { ProcessSummary } from "@sims/utilities/logger";
import { EligibleECertDisbursement } from "../../disbursement-schedule.models";

/**
 * Check overaward balances and apply award credit or deduction if needed.
 */
export abstract class OverawardsBalanceHandler {
  /**
   * Handle the overawards adjustments for a student during the e-Cert disbursement.
   * The student may have a positive or negative overaward balance that needs to be
   * adjusted by applying credits (negative balance) or deductions (positive balance)
   * to the awards being disbursed.
   * @param eCertDisbursement eligible disbursement to be potentially added to an e-Cert.
   * @param loan specific loan award being adjusted (e.g CSLF, BCSL).
   * @param overawardBalance total overaward balance be deducted.
   * @param entityManager used to execute the commands in the same transaction.
   * @param log cumulative log summary.
   */
  abstract process(
    eCertDisbursement: EligibleECertDisbursement,
    loan: DisbursementValue,
    overawardBalance: number,
    entityManager: EntityManager,
    log: ProcessSummary,
  ): Promise<void>;
}
