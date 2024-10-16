import {
  CASSupplierResponseItem,
  CASSupplierResponseItemAddress,
} from "@sims/integrations/cas";

/**
 * Possible results for a student CAS supplier evaluation.
 */
export enum CASEvaluationStatus {
  /**
   * Some condition requires a manual intervention.
   */
  ManualInterventionRequired,
  /**
   * Found an active CAS supplier for the student.
   */
  ActiveSupplierFound,
  /**
   * An active CAS supplier was not found.
   */
  NotFound,
}

/**
 * Possible manual interventions.
 */
export enum ManualInterventionReason {
  GivenNamesNotPresent = "Given names not present",
  NonCanadianAddress = "Non-Canadian address",
}

/**
 * Possible reasons that a CAS supplier was considered not found.
 */
export enum NotFoundReason {
  SupplierNotFound = "Supplier not found",
  NoActiveSupplierFound = "Supplier found but not active",
}

export interface CASEvaluationManualInterventionResult {
  status: CASEvaluationStatus.ManualInterventionRequired;
  reason: ManualInterventionReason;
}

export interface CASFoundSupplierResult {
  status: CASEvaluationStatus.ActiveSupplierFound;
  activeSupplier: CASSupplierResponseItem;
  activeSites: CASSupplierResponseItemAddress[];
}

export interface CASNotFoundSupplierResult {
  status: CASEvaluationStatus.NotFound;
  reason: NotFoundReason;
}

export type CASEvaluationResult =
  | CASNotFoundSupplierResult
  | CASFoundSupplierResult
  | CASEvaluationManualInterventionResult;
