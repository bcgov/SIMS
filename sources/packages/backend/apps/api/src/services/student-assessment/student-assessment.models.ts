import { ECertFailedValidationResult } from "@sims/integrations/services";
import { ECertPreValidatorResult } from "@sims/integrations/services/disbursement-schedule/e-cert-calculation";
import { AcceptAssessmentRestrictionsEvaluationResult } from "@sims/services";

/**
 * Consolidate different evaluation results to determine if a Student Assessment can be accepted by the student.
 */
export class AcceptAssessmentEvaluationResult {
  constructor(
    eCertPreValidatorResult: ECertPreValidatorResult,
    acceptAssessmentRestrictionsEvaluationResult: AcceptAssessmentRestrictionsEvaluationResult,
  ) {
    this.canAcceptAssessment =
      eCertPreValidatorResult.canAcceptAssessment &&
      acceptAssessmentRestrictionsEvaluationResult.canAcceptAssessment;
    this.eCertFailedValidations = eCertPreValidatorResult.failedValidations;
    this.acceptAssessmentRestrictions =
      acceptAssessmentRestrictionsEvaluationResult.restrictionCodes;
    this.hasFailedECertValidations =
      !eCertPreValidatorResult.canAcceptAssessment;
    this.hasAcceptAssessmentRestrictions =
      !acceptAssessmentRestrictionsEvaluationResult.canAcceptAssessment;
  }

  /**
   * Consolidated result indicating if the Student Assessment
   * can be accepted by the student.
   */
  readonly canAcceptAssessment: boolean;
  /**
   * Indicates if there are any failed e-Cert validations that would
   * prevent the Student Assessment from being accepted by the student.
   * This is one of the possible reasons that can prevent the Student
   * Assessment from being accepted by the student.
   */
  readonly hasFailedECertValidations: boolean;
  /**
   * Indicates if there are any institution restrictions that would prevent
   * the Student Assessment from being accepted by the student.
   * This is one of the possible reasons that can prevent the Student Assessment
   * from being accepted by the student.
   */
  readonly hasAcceptAssessmentRestrictions: boolean;
  /**
   * Additional information about institution restrictions that would prevent the
   * Student Assessment from being accepted by the student.
   */
  readonly acceptAssessmentRestrictions: string[];
  /**
   * Additional information about the failed e-Cert validations that would prevent
   * the Student Assessment from being accepted by the student.
   */
  readonly eCertFailedValidations: ReadonlyArray<ECertFailedValidationResult>;
}
