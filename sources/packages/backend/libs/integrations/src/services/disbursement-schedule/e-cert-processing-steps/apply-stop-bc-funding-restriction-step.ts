import { Injectable } from "@nestjs/common";
import { EntityManager } from "typeorm";
import { Restriction } from "@sims/sims-db";
import { ECertProcessStep } from "./e-cert-steps-models";
import { ProcessSummary } from "@sims/utilities/logger";
import { EligibleECertDisbursement } from "../disbursement-schedule.models";
import { getStopFundingTypesAndRestrictionsMap } from "./e-cert-steps-utils";

/**
 * Handles funding restrictions for both full-time and part-time students.
 * Applies restrictions that stop some funding types from being disbursed.
 */
@Injectable()
export class ApplyStopBCFundingRestrictionStep implements ECertProcessStep {
  /**
   * Check active student restriction that should stop some funding type from being disbursed.
   * In case some is present, awards will be updated to not be disbursed.
   * @param eCertDisbursement eligible disbursement to be potentially added to an e-Cert.
   * @param _entityManager not used for this step.
   * @param log cumulative log summary.
   */
  executeStep(
    eCertDisbursement: EligibleECertDisbursement,
    _entityManager: EntityManager,
    log: ProcessSummary,
  ): boolean {
    log.info("Checking stop funding restriction.");
    const stopFundingMap =
      getStopFundingTypesAndRestrictionsMap(eCertDisbursement);
    if (!stopFundingMap.size) {
      log.info("No active restrictions found.");
      return true;
    }
    for (const disbursementValue of eCertDisbursement.disbursement
      .disbursementValues) {
      if (stopFundingMap.has(disbursementValue.valueType)) {
        log.info(`Applying restriction for ${disbursementValue.valueCode}.`);
        const [restriction] = stopFundingMap.get(disbursementValue.valueType);
        disbursementValue.restrictionAmountSubtracted =
          disbursementValue.valueAmount -
          (disbursementValue.disbursedAmountSubtracted ?? 0) -
          (disbursementValue.overawardAmountSubtracted ?? 0);
        disbursementValue.effectiveAmount = 0;
        disbursementValue.restrictionSubtracted = {
          id: restriction.id,
        } as Restriction;
      }
    }
    return true;
  }
}
