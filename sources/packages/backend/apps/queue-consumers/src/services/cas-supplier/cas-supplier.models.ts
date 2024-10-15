import {
  CASSupplierResponseItem,
  CASSupplierResponseItemAddress,
} from "@sims/integrations/cas/models/cas-supplier-response.model";

export enum CASEvaluationStatus {
  ManualInterventionRequired,
  ActiveSupplierFound,
  NotFound,
}

export enum ManualInterventionReason {
  GivenNamesNotPresent,
  NonCanadianAddress,
}

export enum NotFoundReason {
  SupplierNotFound,
  NoActiveSupplierFound,
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
