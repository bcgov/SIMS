import { RestrictionActionType } from "@sims/sims-db";
import { ProcessSummary } from "@sims/utilities/logger";
import { EntityManager } from "typeorm";
import { ECertProcessStep, ValidateDisbursementBase } from ".";
import { Injectable } from "@nestjs/common";
import {
  ECertFailedValidation,
  EligibleECertDisbursement,
} from "../disbursement-schedule.models";
import { getRestrictionByActionType } from "./e-cert-steps-utils";
import { ECertPreValidator } from "@sims/integrations/services/disbursement-schedule/e-cert-calculation/e-cert-pre-validation-service-models";
import { ECertPreValidatorResult } from "@sims/integrations/services/disbursement-schedule/e-cert-calculation/e-cert-pre-validation-service-models";

/**
 * Specific e-Cert validations for full-time.
 */
@Injectable()
export class ValidateDisbursementFullTimeStep
  extends ValidateDisbursementBase
  implements ECertProcessStep, ECertPreValidator
{
  /**
   * Validate full-time disbursements.
   * @param eCertDisbursement eligible disbursement to be potentially added to an e-Cert.
   * @param _entityManager not used for this step.
   * @param log cumulative log summary.
   */
  async executeStep(
    eCertDisbursement: EligibleECertDisbursement,
    _entityManager: EntityManager,
    log: ProcessSummary,
  ): Promise<boolean> {
    const validationResult = await this.executePreValidations(
      eCertDisbursement,
      _entityManager,
      log,
    );
    return validationResult.canGenerateECert;
  }

  /**
   * Allow the evaluation of conditions that would block
   * an eligible disbursement to be disbursed.
   * The intention to to know ahead of time of the existence
   * of such conditions in a way that an action can take
   * to allow the money to be disbursed.
   * @param eCertDisbursement eligible disbursement to be validated.
   * @param _entityManager not used for full-time.
   * @param log keep it compliant with the required parameters
   * used by {@link ECertProcessStep}.
   * @returns list of failed validations, otherwise an empty array if
   * no blocking conditions were found.
   */
  async executePreValidations(
    eCertDisbursement: EligibleECertDisbursement,
    _entityManager: EntityManager,
    log: ProcessSummary,
  ): Promise<ECertPreValidatorResult> {
    log.info("Executing full-time disbursement validations.");
    const validationResults = super.validate(eCertDisbursement, log);
    // Validate stop full-time disbursement restrictions.
    const stopFullTimeDisbursement = getRestrictionByActionType(
      eCertDisbursement,
      RestrictionActionType.StopFullTimeDisbursement,
    );
    if (stopFullTimeDisbursement) {
      log.info(
        `Student has an active '${RestrictionActionType.StopFullTimeDisbursement}' restriction and the disbursement calculation will not proceed.`,
      );
      validationResults.push(
        ECertFailedValidation.HasStopDisbursementRestriction,
      );
    }
    return new ECertPreValidatorResult(validationResults);
  }
}
