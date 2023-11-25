import { Injectable } from "@nestjs/common";
import { EntityManager } from "typeorm";
import { DisbursementSchedule, RestrictionActionType } from "@sims/sims-db";
import {
  getStudentRestrictionByActionType,
  shouldStopFunding,
} from "./e-cert-steps-utils";
import { ECertProcessStep } from "./e-cert-steps-models";
import { ProcessSummary } from "@sims/utilities/logger";

/**
 * Check active student restriction that should stop
 * any BC funding from being disbursed.
 */
@Injectable()
export class ApplyStopBCFundingRestrictionFullTimeStep
  implements ECertProcessStep
{
  /**
   * Check active student restriction that should stop any BC funding from being disbursed.
   * In case some is present, BC awards will be updated to not be disbursed.
   * @param disbursement eligible disbursement to be potentially added to an e-Cert.
   * @param _entityManager not used for this step.
   * @param log cumulative log summary.
   */
  executeStep(
    disbursement: DisbursementSchedule,
    _entityManager: EntityManager,
    log: ProcessSummary,
  ): boolean {
    log.info(
      `Checking '${RestrictionActionType.StopFullTimeBCFunding}' restriction.`,
    );
    for (const disbursementValue of disbursement.disbursementValues) {
      if (shouldStopFunding(disbursement, disbursementValue)) {
        log.info(`Applying restriction for ${disbursementValue.valueCode}.`);
        const studentRestriction = getStudentRestrictionByActionType(
          disbursement.studentAssessment.application.student
            .studentRestrictions,
          RestrictionActionType.StopFullTimeBCFunding,
        );
        disbursementValue.restrictionAmountSubtracted =
          disbursementValue.valueAmount -
          (disbursementValue.disbursedAmountSubtracted ?? 0) -
          (disbursementValue.overawardAmountSubtracted ?? 0);
        disbursementValue.effectiveAmount = 0;
        disbursementValue.restrictionSubtracted =
          studentRestriction.restriction;
      }
    }
    return true;
  }
}
