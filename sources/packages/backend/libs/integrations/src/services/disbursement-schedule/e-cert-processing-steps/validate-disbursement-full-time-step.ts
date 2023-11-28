import { RestrictionActionType } from "@sims/sims-db";
import { ProcessSummary } from "@sims/utilities/logger";
import { EntityManager } from "typeorm";
import { ECertProcessStep, ValidateDisbursementBase } from ".";
import { Injectable } from "@nestjs/common";
import { EligibleECertDisbursement } from "../disbursement-schedule.models";
import { getRestrictionByActionType } from "./e-cert-steps-utils";

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
   * @param eCertDisbursement eligible disbursement to be potentially added to an e-Cert.
   * @param _entityManager not used for this step.
   * @param log cumulative log summary.
   */
  executeStep(
    eCertDisbursement: EligibleECertDisbursement,
    _entityManager: EntityManager,
    log: ProcessSummary,
  ): boolean {
    log.info("Executing full-time disbursement validations.");
    let shouldContinue = super.validate(eCertDisbursement, log);
    // Validate stop full-time disbursement restrictions.
    const stopFullTimeDisbursement = getRestrictionByActionType(
      eCertDisbursement,
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
