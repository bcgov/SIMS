import { DisbursementSchedule, RestrictionActionType } from "@sims/sims-db";
import { ProcessSummary } from "@sims/utilities/logger";
import { EntityManager } from "typeorm";
import { getStudentRestrictionByActionType } from "./e-cert-steps-utils";
import { ECertProcessStep, ValidateDisbursementBase } from ".";
import { Injectable } from "@nestjs/common";

@Injectable()
export class ValidateDisbursementPartTimeStep
  extends ValidateDisbursementBase
  implements ECertProcessStep
{
  /**
   * Validate part-time disbursements.
   * @param disbursement disbursement object with all modifications to be saved.
   * @param _entityManager not used for this step.
   * @param log cumulative log summary.
   */
  executeStep(
    disbursement: DisbursementSchedule,
    _entityManager: EntityManager,
    log: ProcessSummary,
  ): boolean {
    log.info("Executing part-time disbursement validations.");
    let shouldContinue = super.validate(disbursement, log);
    // Validate stop part-time disbursement restrictions.
    const stopPartTimeDisbursement = getStudentRestrictionByActionType(
      disbursement.studentAssessment.application.student.studentRestrictions,
      RestrictionActionType.StopPartTimeDisbursement,
    );
    if (stopPartTimeDisbursement) {
      log.info(
        `Student has an active '${RestrictionActionType.StopPartTimeDisbursement}' restriction and the disbursement calculation will not proceed.`,
      );
      shouldContinue = false;
    }
    return shouldContinue;
  }
}
