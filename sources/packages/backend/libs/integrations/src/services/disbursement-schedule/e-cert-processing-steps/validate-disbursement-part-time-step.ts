import { RestrictionActionType } from "@sims/sims-db";
import { ProcessSummary } from "@sims/utilities/logger";
import { EntityManager } from "typeorm";
import { ECertProcessStep, ValidateDisbursementBase } from ".";
import { Injectable } from "@nestjs/common";
import { EligibleECertDisbursement } from "../disbursement-schedule.models";
import { getRestrictionByActionType } from "./e-cert-steps-utils";

/**
 * Specific e-Cert validations for part-time.
 */
@Injectable()
export class ValidateDisbursementPartTimeStep
  extends ValidateDisbursementBase
  implements ECertProcessStep
{
  /**
   * Validate part-time disbursements.
   * @param eCertDisbursement eligible disbursement to be potentially added to an e-Cert.
   * @param _entityManager not used for this step.
   * @param log cumulative log summary.
   */
  executeStep(
    eCertDisbursement: EligibleECertDisbursement,
    _entityManager: EntityManager,
    log: ProcessSummary,
  ): boolean {
    log.info("Executing part-time disbursement validations.");
    let shouldContinue = super.validate(eCertDisbursement, log);
    // Validate stop part-time disbursement restrictions.
    const stopPartTimeDisbursement = getRestrictionByActionType(
      eCertDisbursement,
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
