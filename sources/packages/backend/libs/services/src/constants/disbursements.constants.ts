import {
  DisbursementValue,
  DisbursementValueType,
  OfferingIntensity,
} from "@sims/sims-db";

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

/**
 * Awards considered for overaward balance calculations.
 * Although CSLP is a loan, part-time loans generates overaward balance, but they are not
 * deducted from the e-Cert, not impacting the student. Therefore, only the full-time loans
 * should be visualized by Ministry and Student at this moment.
 */
export const OVERAWARD_BALANCE_FULL_TIME_AWARDS = [
  CANADA_STUDENT_LOAN_FULL_TIME_AWARD_CODE,
  BC_STUDENT_LOAN_AWARD_CODE,
];

export const OVERAWARD_BALANCE_PART_TIME_AWARDS = [
  CANADA_STUDENT_LOAN_PART_TIME_AWARD_CODE,
];

export const OVERAWARD_BALANCE_AWARDS: Record<OfferingIntensity, string[]> = {
  [OfferingIntensity.fullTime]: OVERAWARD_BALANCE_FULL_TIME_AWARDS,
  [OfferingIntensity.partTime]: OVERAWARD_BALANCE_PART_TIME_AWARDS,
};

export type DisbursementValueCode =
  | typeof CANADA_STUDENT_LOAN_FULL_TIME_AWARD_CODE
  | typeof CANADA_STUDENT_LOAN_PART_TIME_AWARD_CODE
  | typeof BC_STUDENT_LOAN_AWARD_CODE;

export type DisbursementValueOverawardCalculation = Pick<
  DisbursementValue,
  "valueCode" | "valueType" | "valueAmount" | "disbursedAmountSubtracted"
>;

export const LOAN_TYPES_ZERO_AMOUNT_DISBURSEMENT: Record<
  DisbursementValueCode,
  DisbursementValueOverawardCalculation
> = {
  [CANADA_STUDENT_LOAN_FULL_TIME_AWARD_CODE]: {
    valueCode: CANADA_STUDENT_LOAN_FULL_TIME_AWARD_CODE,
    valueType: DisbursementValueType.CanadaLoan,
    valueAmount: 0,
  },
  [CANADA_STUDENT_LOAN_PART_TIME_AWARD_CODE]: {
    valueCode: CANADA_STUDENT_LOAN_PART_TIME_AWARD_CODE,
    valueType: DisbursementValueType.CanadaLoan,
    valueAmount: 0,
  },
  [BC_STUDENT_LOAN_AWARD_CODE]: {
    valueCode: BC_STUDENT_LOAN_AWARD_CODE,
    valueType: DisbursementValueType.BCLoan,
    valueAmount: 0,
  },
};
