import { DisbursementValue, EducationProgramOffering } from "@sims/sims-db";

/**
 * Award information needed for the max tuition remittance calculation.
 */
export type Award = Pick<
  DisbursementValue,
  "valueType" | "disbursedAmountSubtracted" | "valueAmount" | "effectiveAmount"
>;

/**
 * Offering information needed for the max tuition remittance calculation.
 */
export type OfferingCosts = Pick<
  EducationProgramOffering,
  "actualTuitionCosts" | "programRelatedCosts"
>;

/**
 * Different options to have the tuition remittance calculated.
 */
export enum MaxTuitionRemittanceTypes {
  Estimated,
  Effective,
}
