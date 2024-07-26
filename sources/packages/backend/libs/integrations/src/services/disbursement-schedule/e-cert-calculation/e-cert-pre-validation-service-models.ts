import {
  ECertFailedValidation,
  EligibleECertDisbursement,
} from "@sims/integrations/services/disbursement-schedule/disbursement-schedule.models";
import { ProcessSummary } from "@sims/utilities/logger";
import { EntityManager } from "typeorm";

const ACCEPT_ASSESSMENT_BLOCKING_VALIDATIONS = [
  ECertFailedValidation.DisabilityStatusNotConfirmed,
  ECertFailedValidation.MSFAACanceled,
  ECertFailedValidation.MSFAANotSigned,
  ECertFailedValidation.HasStopDisbursementRestriction,
  ECertFailedValidation.NoEstimatedAwardAmounts,
];

/**
 * Result of validations for a e-Cert generation.
 */
export class ECertPreValidatorResult {
  private readonly hasBlockingValidations: boolean;

  constructor(private eCertFailedValidations: ECertFailedValidation[]) {
    this.hasBlockingValidations = eCertFailedValidations.some((validation) =>
      ACCEPT_ASSESSMENT_BLOCKING_VALIDATIONS.includes(validation),
    );
  }

  /**
   * List of all failed e-Cert validations.
   */
  get failedValidations(): ReadonlyArray<ECertFailedValidation> {
    return this.eCertFailedValidations;
  }

  /**
   * Indicates if a Student Assessment can be accepted by the student
   * based in the e-Cert blocking conditions.
   */
  get canAcceptAssessment(): boolean {
    return !this.hasBlockingValidations;
  }

  /**
   * Indicates if the e-Cert can be generated.
   */
  get canGenerateECert(): boolean {
    return !this.eCertFailedValidations.length;
  }
}

/**
 * Allow validations to be executed before the e-Cert disbursement time.
 */
export interface ECertPreValidator {
  /**
   * Allow the evaluation of conditions that would block
   * an eligible disbursement to be disbursed.
   * The intention is to know ahead of time of the existence
   * of such conditions in a way that an action can be taken
   * to allow the money to be disbursed.
   * @param eCertDisbursement eligible disbursement to be validated.
   * @param entityManager keep it compliant with the required parameters
   * used by {@link ECertProcessStep}.
   * @param log keep it compliant with the required parameters
   * used by {@link ECertProcessStep}.
   * @returns list of failed validations, otherwise an empty array if
   * no blocking conditions were found.
   */
  executePreValidations(
    eCertDisbursement: EligibleECertDisbursement,
    entityManager: EntityManager,
    log: ProcessSummary,
  ): Promise<ECertPreValidatorResult>;
}
