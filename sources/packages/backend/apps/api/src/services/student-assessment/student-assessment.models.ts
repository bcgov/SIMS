import { ECertFailedValidationResult } from "@sims/integrations/services";
import { ECertPreValidatorResult } from "@sims/integrations/services/disbursement-schedule/e-cert-calculation";
import {
  AcceptAssessmentRestriction,
  AcceptAssessmentRestrictionsEvaluationResult,
} from "@sims/services";
import { StudentNote } from "@sims/services";
import { Application } from "@sims/sims-db";

/**
 * Consolidate different evaluation results to determine if a
 * Student Assessment can be accepted by the Student.
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
      acceptAssessmentRestrictionsEvaluationResult.restrictions;
    this.hasFailedECertValidations =
      !eCertPreValidatorResult.canAcceptAssessment;
    this.hasAcceptAssessmentRestrictions =
      !acceptAssessmentRestrictionsEvaluationResult.canAcceptAssessment;
  }

  /**
   * Consolidated result indicating if the Student Assessment
   * can be accepted by the Student.
   */
  readonly canAcceptAssessment: boolean;
  /**
   * Indicates if there are any failed e-Cert validations that would
   * prevent the Student Assessment from being accepted by the Student.
   * This is one of the possible reasons that can prevent the Student
   * Assessment from being accepted by the Student.
   */
  readonly hasFailedECertValidations: boolean;
  /**
   * Indicates if there are any institution restrictions that would prevent
   * the Student Assessment from being accepted by the Student.
   * This is one of the possible reasons that can prevent the Student Assessment
   * from being accepted by the Student.
   */
  readonly hasAcceptAssessmentRestrictions: boolean;
  /**
   * Additional information about institution restrictions that would prevent the
   * Student Assessment from being accepted by the Student.
   */
  readonly acceptAssessmentRestrictions: AcceptAssessmentRestriction[];
  /**
   * Additional information about the failed e-Cert validations that would prevent
   * the Student Assessment from being accepted by the Student.
   */
  readonly eCertFailedValidations: ReadonlyArray<ECertFailedValidationResult>;
}

/**
 * Application, with the new assessment attached, and the associated note, built for a
 * manual reassessment but not yet persisted.
 */
export interface BatchManualReassessmentResult {
  /**
   * Application, with the new assessment attached, ready to be saved.
   */
  application: Application;
  /**
   * Note explaining the reassessment, ready to be saved and associated with the student.
   */
  note: StudentNote;
}
