import {
  CASSupplierResponseItem,
  CASSupplierResponseItemAddress,
} from "@sims/integrations/cas";

/**
 * Possible results for a student CAS supplier evaluation.
 */
export enum CASEvaluationStatus {
  /**
   * Some conditions to retrieve the CAS information from CAS are not fulfilled.
   */
  PreValidationsFailed = "PreValidationsFailed",
  /**
   * Found an active CAS supplier for the student.
   */
  ActiveSupplierFound = "ActiveSupplierFound",
  /**
   * An active CAS supplier was not found.
   */
  NotFound = "NotFound",
}

/**
 * Possible manual interventions.
 */
export enum PreValidationsFailedReason {
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

/**
 * CAS pre-validations to ensure a student can be added to CAS.
 */
export interface CASPreValidationsResult {
  status: CASEvaluationStatus.PreValidationsFailed;
  reasons: PreValidationsFailedReason[];
}

/**
 * Active CAS supplier found on CAS.
 */
export interface CASFoundSupplierResult {
  status: CASEvaluationStatus.ActiveSupplierFound;
  /**
   * CAS active supplier.
   */
  activeSupplier: CASSupplierResponseItem;
  /**
   * CAS site that matches with the student address.
   */
  matchedAddress?: CASSupplierResponseItemAddress;
}

/**
 * No active supplier found on CAS.
 */
export interface CASNotFoundSupplierResult {
  status: CASEvaluationStatus.NotFound;
  reason: NotFoundReason;
}

/**
 * Evaluation results that required different processing.
 */
export type CASEvaluationResult =
  | CASNotFoundSupplierResult
  | CASFoundSupplierResult
  | CASPreValidationsResult;
