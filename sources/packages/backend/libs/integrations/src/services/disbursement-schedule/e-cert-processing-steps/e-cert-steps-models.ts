import { ProcessSummary } from "@sims/utilities/logger";
import { EntityManager } from "typeorm";
import { EligibleECertDisbursement } from "../disbursement-schedule.models";

/**
 * Represents a single step on an e-Cert calculation process.
 */
export interface ECertProcessStep {
  /**
   * e-Cert step execution. Every step executes calculations and/or modification
   * in the provided disbursement. The disbursement is intended to be shared across
   * all steps.
   * @param eCertDisbursement eligible disbursement to be potentially added to an e-Cert.
   * @param entityManager used to execute the commands in the same transaction.
   * For steps that are not directly accessing or changing the database this
   * parameter will be provided as part of this common method but can be ignored.
   * @param log cumulative log summary.
   * @returns true if the steps execution can proceed, otherwise, false.
   */
  executeStep(
    eCertDisbursement: EligibleECertDisbursement,
    entityManager: EntityManager,
    log: ProcessSummary,
  ): Promise<boolean> | boolean;
}
