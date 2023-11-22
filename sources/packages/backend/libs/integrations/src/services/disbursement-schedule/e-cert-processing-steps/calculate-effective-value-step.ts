import { Injectable } from "@nestjs/common";
import { round } from "@sims/utilities";
import { EntityManager } from "typeorm";
import { DisbursementSchedule } from "@sims/sims-db";
import { ECertProcessStep } from "./e-cert-steps-models";
import { ProcessSummary } from "@sims/utilities/logger";

@Injectable()
export class CalculateEffectiveValueStep implements ECertProcessStep {
  /**
   * Calculate the effective value for every award. The result of this calculation
   * will be the value used to generate the e-Cert.
   * @param disbursements all disbursements that are part of one e-Cert.
   * @param entityManager used to execute the commands in the same transaction.
   */
  executeStep(
    disbursement: DisbursementSchedule,
    _entityManager: EntityManager,
    log: ProcessSummary,
  ): void {
    log.info("Calculating effective value.");
    for (const disbursementValue of disbursement.disbursementValues) {
      const effectiveValue =
        disbursementValue.valueAmount -
        (disbursementValue.disbursedAmountSubtracted ?? 0) -
        (disbursementValue.overawardAmountSubtracted ?? 0);
      disbursementValue.effectiveAmount = round(effectiveValue);
    }
  }
}
