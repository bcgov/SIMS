import { Injectable } from "@nestjs/common";
import { EntityManager } from "typeorm";
import { Restriction, RestrictionActionType } from "@sims/sims-db";
import {
  getRestrictionByActionType,
  shouldStopPartTimeBCFunding,
} from "./e-cert-steps-utils";
import { ECertProcessStep } from "./e-cert-steps-models";
import { ProcessSummary } from "@sims/utilities/logger";
import { EligibleECertDisbursement } from "../disbursement-schedule.models";

/**
 * Check active student restriction that should stop
 * any BC funding from being disbursed.
 */
@Injectable()
export class ApplyStopBCFundingRestrictionPartTimeStep
  implements ECertProcessStep
{
  /**
   * Check active student restriction that should stop any BC funding from being disbursed.
   * In case some is present, BC awards will be updated to not be disbursed.
   * @param eCertDisbursement eligible disbursement to be potentially added to an e-Cert.
   * @param _entityManager not used for this step.
   * @param log cumulative log summary.
   */
  executeStep(
    eCertDisbursement: EligibleECertDisbursement,
    _entityManager: EntityManager,
    log: ProcessSummary,
  ): boolean {
    log.info(
      `Checking '${RestrictionActionType.StopPartTimeBCFunding}' restriction.`,
    );
    for (const disbursementValue of eCertDisbursement.disbursement
      .disbursementValues) {
      if (shouldStopPartTimeBCFunding(eCertDisbursement, disbursementValue)) {
        log.info(`Applying restriction for ${disbursementValue.valueCode}.`);
        const restriction = getRestrictionByActionType(
          eCertDisbursement,
          RestrictionActionType.StopPartTimeBCFunding,
        );
        console.log(JSON.stringify(restriction));
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
