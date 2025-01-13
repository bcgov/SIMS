import { DisbursementValueType } from "@sims/sims-db";

/**
 * Types of disbursements values considered loans.
 */
export const LOAN_TYPES = [
  DisbursementValueType.CanadaLoan,
  DisbursementValueType.BCLoan,
];

/**
 * Types of disbursements values considered grants.
 */
export const GRANTS_TYPES = [
  DisbursementValueType.CanadaGrant,
  DisbursementValueType.BCGrant,
];

/**
 * Types of disbursements values related to the province.
 */
export const BC_FUNDING_TYPES = [
  DisbursementValueType.BCLoan,
  DisbursementValueType.BCGrant,
  DisbursementValueType.BCTotalGrant,
];

/**
 * Code for the BC total grants calculated during e-Cert generation.
 * BC individual grants are not part of the e-Cert, only the sum of them,
 * that is represented by this code.
 */
export const BC_TOTAL_GRANT_AWARD_CODE = "BCSG";

export const BC_STUDENT_LOAN_AWARD_CODE = "BCSL";
export const CANADA_STUDENT_LOAN_FULL_TIME_AWARD_CODE = "CSLF";
export const CANADA_STUDENT_LOAN_PART_TIME_AWARD_CODE = "CSLP";
