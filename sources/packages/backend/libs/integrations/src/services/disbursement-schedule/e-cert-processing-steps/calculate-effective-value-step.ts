import { Injectable } from "@nestjs/common";
import { round } from "@sims/utilities";
import { EntityManager } from "typeorm";
import { DisbursementSchedule } from "@sims/sims-db";
import { ECertProcessStep } from "./e-cert-steps-models";
import { ProcessSummary } from "@sims/utilities/logger";

/**
 * Calculate the effective value that represents the amount that
 * should be added to the e-Cert not considering values already paid
 * to the student and possible overawards.
 */
@Injectable()
export class CalculateEffectiveValueStep implements ECertProcessStep {
  /**
   * Calculate the effective value for every award. The result of this calculation
   * will be the value used to generate the e-Cert.
   * @param disbursement eligible disbursement to be potentially added to an e-Cert.
   * @param _entityManager not used for this step.
   * @param log cumulative log summary.
   */
  executeStep(
    disbursement: DisbursementSchedule,
    _entityManager: EntityManager,
    log: ProcessSummary,
  ): boolean {
    log.info("Calculating effective values.");
    for (const disbursementValue of disbursement.disbursementValues) {
      const effectiveValue =
        disbursementValue.valueAmount -
        (disbursementValue.disbursedAmountSubtracted ?? 0) -
        (disbursementValue.overawardAmountSubtracted ?? 0);
      disbursementValue.effectiveAmount = round(effectiveValue);
      log.info(`Calculation executed for ${disbursementValue.valueCode}.`);
    }
    return true;
  }
}
