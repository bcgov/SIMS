import { Injectable } from "@nestjs/common";
import { EntityManager } from "typeorm";
import {
  Restriction,
  RestrictionActionType,
  OfferingIntensity,
} from "@sims/sims-db";
import { ECertProcessStep } from "./e-cert-steps-models";
import { ProcessSummary } from "@sims/utilities/logger";
import { EligibleECertDisbursement } from "../disbursement-schedule.models";
import {
  shouldStopBCFunding,
  getRestrictionByActionType,
} from "./e-cert-steps-utils";

/**
 * Handles BC funding restrictions for both full-time and part-time students.
 * Applies restrictions that stop BC funding from being disbursed.
 */
@Injectable()
export class ApplyStopBCFundingRestrictionStep implements ECertProcessStep {
  // Mapping of offering intensity to corresponding restriction action type.
  private readonly restrictionMap = {
    [OfferingIntensity.fullTime]: RestrictionActionType.StopFullTimeBCFunding,
    [OfferingIntensity.partTime]: RestrictionActionType.StopPartTimeBCFunding,
  };

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
    const offeringIntensity = eCertDisbursement.offering.offeringIntensity;
    const restrictionType = this.restrictionMap[offeringIntensity];

    log.info(`Checking '${restrictionType}' restriction.`);
    for (const disbursementValue of eCertDisbursement.disbursement
      .disbursementValues) {
      if (shouldStopBCFunding(eCertDisbursement, disbursementValue)) {
        log.info(`Applying restriction for ${disbursementValue.valueCode}.`);
        // Get the appropriate restriction based on offering intensity
        const restriction = getRestrictionByActionType(
          eCertDisbursement,
          eCertDisbursement.offering.offeringIntensity ===
            OfferingIntensity.fullTime
            ? RestrictionActionType.StopFullTimeBCFunding
            : RestrictionActionType.StopPartTimeBCFunding,
        );

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
