import { RestrictionActionType } from "@sims/sims-db";
import { ProcessSummary } from "@sims/utilities/logger";
import { EntityManager } from "typeorm";
import { ECertProcessStep, ValidateDisbursementBase } from ".";
import { Injectable } from "@nestjs/common";
import {
  ECertFailedValidation,
  EligibleECertDisbursement,
} from "../disbursement-schedule.models";
import {
  getRestrictionByActionType,
  logActiveRestrictionsBypasses,
} from "./e-cert-steps-utils";
import { CANADA_STUDENT_LOAN_PART_TIME_AWARD_CODE } from "@sims/services/constants";
import { ECertGenerationService } from "../e-cert-generation.service";
import { StudentLoanBalanceSharedService } from "@sims/services";
import {
  ECertPreValidator,
  ECertPreValidatorResult,
} from "@sims/integrations/services/disbursement-schedule/e-cert-calculation/e-cert-pre-validation-service-models";

/**
 * Specific e-Cert validations for part-time.
 */
@Injectable()
export class ValidateDisbursementPartTimeStep
  extends ValidateDisbursementBase
  implements ECertProcessStep, ECertPreValidator
{
  constructor(
    private readonly eCertGenerationService: ECertGenerationService,
    private readonly studentLoanBalanceSharedService: StudentLoanBalanceSharedService,
  ) {
    super();
  }
  /**
   * Validate part-time disbursements.
   * @param eCertDisbursement eligible disbursement to be potentially added to an e-Cert.
   * @param entityManager used to execute the commands in the same transaction.
   * @param log cumulative log summary.
   */
  async executeStep(
    eCertDisbursement: EligibleECertDisbursement,
    entityManager: EntityManager,
    log: ProcessSummary,
  ): Promise<boolean> {
    const validationResult = await this.executePreValidations(
      eCertDisbursement,
      entityManager,
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
   * @param _entityManager keep it compliant with the required parameters
   * used by {@link ECertProcessStep}.
   * @param log keep it compliant with the required parameters
   * used by {@link ECertProcessStep}.
   * @returns list of failed validations, otherwise an empty array if
   * no blocking conditions were found.
   */
  async executePreValidations(
    eCertDisbursement: EligibleECertDisbursement,
    entityManager: EntityManager,
    log: ProcessSummary,
  ): Promise<ECertPreValidatorResult> {
    log.info("Executing part-time disbursement validations.");
    const validationResults = super.validate(eCertDisbursement, log);
    // Validate stop part-time disbursement restrictions.
    const stopPartTimeDisbursement = getRestrictionByActionType(
      eCertDisbursement,
      RestrictionActionType.StopPartTimeDisbursement,
    );
    if (stopPartTimeDisbursement) {
      log.info(
        `Student has an active '${RestrictionActionType.StopPartTimeDisbursement}' restriction and the disbursement calculation will not proceed.`,
      );
      validationResults.push(
        ECertFailedValidation.HasStopDisbursementRestriction,
      );
    }
    logActiveRestrictionsBypasses(
      eCertDisbursement.activeRestrictionBypasses,
      log,
    );
    // Validate CSLP.
    const validateLifetimeMaximumCSLP = await this.validateCSLPLifetimeMaximum(
      eCertDisbursement,
      entityManager,
      log,
    );
    if (!validateLifetimeMaximumCSLP) {
      validationResults.push(ECertFailedValidation.LifetimeMaximumCSLP);
    }
    return new ECertPreValidatorResult(validationResults);
  }

  /**
   * Validate if CSLP disbursed exceeded the lifetime maximums.
   * @param eCertDisbursement eligible disbursement to be potentially added to an e-Cert.
   * @param entityManager used to execute the commands in the same transaction.
   * @param log cumulative log summary.
   */
  private async validateCSLPLifetimeMaximum(
    eCertDisbursement: EligibleECertDisbursement,
    entityManager: EntityManager,
    log: ProcessSummary,
  ) {
    log.info("Validate CSLP Lifetime Maximum.");
    // Get the disbursed value for the CSLP in the current disbursement.
    const disbursementCSLP =
      eCertDisbursement.disbursement.disbursementValues.find(
        (item) => item.valueCode === CANADA_STUDENT_LOAN_PART_TIME_AWARD_CODE,
      );
    if (!disbursementCSLP?.valueAmount) {
      return true;
    }
    // Fetch lifetime maximum of CSLP from the workflow data.
    const lifetimeMaximumsCSLPPromise =
      this.eCertGenerationService.getCSLPLifetimeMaximums(
        eCertDisbursement.assessmentId,
        entityManager,
      );
    // Get latest CSLP monthly balance.
    const latestCSLPBalancePromise =
      this.studentLoanBalanceSharedService.getLatestCSLPBalance(
        eCertDisbursement.studentId,
      );
    const [lifetimeMaximumsCSLP, latestCSLPBalance] = await Promise.all([
      lifetimeMaximumsCSLPPromise,
      latestCSLPBalancePromise,
    ]);
    // Check if lifetime maximum CSLP is less than or equal to the sum of disbursed CSLP and latest student loan balance.
    if (
      lifetimeMaximumsCSLP >=
      disbursementCSLP.valueAmount + latestCSLPBalance
    ) {
      log.info(
        "Lifetime maximum CSLP is greater than or equal to the sum of disbursed CSLP and latest student loan balance.",
      );
      return true;
    }
    log.info(
      "Lifetime maximum CSLP is reached, part time disbursement is stopped.",
    );
    return false;
  }
}
