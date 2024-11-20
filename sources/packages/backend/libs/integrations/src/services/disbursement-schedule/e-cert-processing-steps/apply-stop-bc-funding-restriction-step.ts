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
import { BC_FUNDING_TYPES } from "@sims/services/constants";

/**
 * Handles BC funding restrictions for both full-time and part-time students.
 * Applies restrictions that stop BC funding from being disbursed.
 */
@Injectable()
export class ApplyStopBCFundingRestrictionStep implements ECertProcessStep {
  // Mapping of offering intensity to corresponding restriction action type
  private readonly restrictionMap = {
    [OfferingIntensity.fullTime]: RestrictionActionType.StopFullTimeBCFunding,
    [OfferingIntensity.partTime]: RestrictionActionType.StopPartTimeBCFunding,
  };

  executeStep(
    eCertDisbursement: EligibleECertDisbursement,
    _entityManager: EntityManager,
    log: ProcessSummary,
  ): boolean {
    const offeringIntensity = eCertDisbursement.offering.offeringIntensity;
    const restrictionType = this.restrictionMap[offeringIntensity];

    // Skip if no matching restriction type for the offering intensity
    if (!restrictionType) {
      return true;
    }

    log.info(`Checking '${restrictionType}' restriction.`);

    // Check if there's an active restriction of this type
    const activeRestriction = eCertDisbursement
      .getEffectiveRestrictions()
      .find((restriction) => restriction.actions.includes(restrictionType));

    if (!activeRestriction) {
      return true;
    }

    // Process all disbursement values that match BC funding types
    eCertDisbursement.disbursement.disbursementValues
      .filter((value) => BC_FUNDING_TYPES.includes(value.valueType))
      .forEach((value) => {
        log.info(`Applying restriction for ${value.valueCode}.`);

        // Calculate and apply restriction
        value.restrictionAmountSubtracted =
          value.valueAmount -
          (value.disbursedAmountSubtracted ?? 0) -
          (value.overawardAmountSubtracted ?? 0);
        value.effectiveAmount = 0;
        value.restrictionSubtracted = {
          id: activeRestriction.id,
        } as Restriction;
      });

    return true;
  }
}
