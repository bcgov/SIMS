import { DisbursementSchedule, RestrictionActionType } from "@sims/sims-db";
import { ProcessSummary } from "@sims/utilities/logger";
import { EntityManager } from "typeorm";
import { getStudentRestrictionByActionType } from "./e-cert-steps-utils";
import { ECertProcessStep, ValidateDisbursementBase } from ".";
import { Injectable } from "@nestjs/common";

/**
 * Specific e-Cert validations for full-time.
 */
@Injectable()
export class ValidateDisbursementFullTimeStep
  extends ValidateDisbursementBase
  implements ECertProcessStep
{
  /**
   * Validate full-time disbursements.
   * @param disbursement eligible disbursement to be potentially added to an e-Cert.
   * @param _entityManager not used for this step.
   * @param log cumulative log summary.
   */
  executeStep(
    disbursement: DisbursementSchedule,
    _entityManager: EntityManager,
    log: ProcessSummary,
  ): boolean {
    log.info("Executing full-time disbursement validations.");
    let shouldContinue = super.validate(disbursement, log);
    // Validate stop full-time disbursement restrictions.
    const stopFullTimeDisbursement = getStudentRestrictionByActionType(
      disbursement.studentAssessment.application.student.studentRestrictions,
      RestrictionActionType.StopFullTimeDisbursement,
    );
    if (stopFullTimeDisbursement) {
      log.info(
        `Student has an active '${RestrictionActionType.StopFullTimeDisbursement}' restriction and the disbursement calculation will not proceed.`,
      );
      shouldContinue = false;
    }
    return shouldContinue;
  }
}
