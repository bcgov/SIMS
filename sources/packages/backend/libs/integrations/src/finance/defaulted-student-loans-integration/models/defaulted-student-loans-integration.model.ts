import { YNFlag } from "../../../models";

export enum DefaultedStudentLoanRecordType {
  Header = "AA",
  Detail = "NA",
  Footer = "ZZ",
}

/**
 * Date format used in the defaulted student loans file.
 * Official document states the format as CCYYMMDD which corresponds to YYYYMMDD.
 */
export const DEFAULTED_STUDENT_LOANS_DATE_FORMAT = "YYYYMMDD";

/**
 * Fixed value sent as transmission ID for the defaulted student loans integration.
 */
export const TRANSMISSION_SOURCE_ID = "STLDLLAB";

/**
 * Space filler used in the defaulted student loans file.
 */
export const SPACE_FILLER = " ";

/**
 * Number filler used in the defaulted student loans file.
 */
export const NUMBER_FILLER = "0";

/**
 * Defaulted student loan balance types.
 */
export enum DefaultedStudentLoanBalanceType {
  BOA = "BOA",
  PRN = "PRN",
  INT = "INT",
  EXP = "EXP",
  DIN = "DIN",
  PDB = "PDB",
}

export interface BalanceTypeItem {
  /**
   * Defaulted student loan balance type name.
   */
  balanceType: DefaultedStudentLoanBalanceType;
  /**
   * Dollar amount for the balance type.
   * - For BOA, PRN, and INT balance types, balance amount must be greater than $0.00.
   * - For balance type DIN, balance amount must be equal to or greater than $0.00.
   */
  balanceAmount: number;
  /**
   * Loan interest rate.
   */
  interestRate: number;
  /**
   * Interest formula code.
   */
  interestFormulaCode: string;
  /**
   * Interest type.
   * FXD - Fixed interest type.
   * PR+ - Prime plus interest type.
   */
  interestType: "FXD" | "PR+";
  /**
   * Flag to determine if interest should be calculated for this balance type for this account.
   */
  shouldCalculateInterest: YNFlag;
  /**
   * Flag to determine if this balance type for this account should use program/portfolio default interest rate or account specific interest rate.
   */
  shouldOverrideInterestRate: YNFlag;
  /**
   * Flag to determine if interest should be reported.
   */
  shouldReportInterest: YNFlag;
  /**
   * The date to start calculation interest from for this balance type.
   * This date is inclusive.
   */
  interestCalculationDate: Date;
}
