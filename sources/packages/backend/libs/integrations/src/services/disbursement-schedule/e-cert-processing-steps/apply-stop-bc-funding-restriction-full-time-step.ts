import { Injectable } from "@nestjs/common";
import { EntityManager } from "typeorm";
import { DisbursementSchedule, RestrictionActionType } from "@sims/sims-db";
import {
  getStudentRestrictionByActionType,
  shouldStopFunding,
} from "./e-cert-steps-utils";
import { ECertProcessStep } from "./e-cert-steps-models";
import { ProcessSummary } from "@sims/utilities/logger";

@Injectable()
export class ApplyStopBCFundingRestrictionFullTimeStep
  implements ECertProcessStep
{
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
    log.info(
      `Checking '${RestrictionActionType.StopFullTimeBCFunding}' restriction.`,
    );
    for (const disbursementValue of disbursement.disbursementValues) {
      if (shouldStopFunding(disbursement, disbursementValue)) {
        log.info(`Applying restriction for ${disbursementValue.valueCode}`);
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
  }
}
