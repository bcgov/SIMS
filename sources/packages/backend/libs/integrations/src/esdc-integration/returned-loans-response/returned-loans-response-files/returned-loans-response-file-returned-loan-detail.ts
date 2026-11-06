import {
  DECIMAL_PLACES_95V99,
  DECIMAL_PLACES_96V99,
  DECIMAL_PLACES_99V94,
  DECIMAL_PLACES_9V94,
  parseCombinedDecimalString,
} from "@sims/utilities";
import { ReturnedLoansResponseFileDetail } from "./returned-loans-response-file-detail";

/**
 * Returned loan response file detail.
 */
export class ReturnedLoansResponseFileReturnedLoanDetail extends ReturnedLoansResponseFileDetail {
  constructor(
    readonly line: string,
    readonly lineNumber: number,
  ) {
    super(line, lineNumber);
  }

  /**
   * Consolidation date.
   * Field: RTG-DET-CONS-DATE.
   *
   */
  get consolidationDate(): Date {
    return this.convertToDateRecord(this.line.substring(32, 40));
  }

  /**
   * Interest rate type.
   * Field: RTG-DET-INT-RATE-TYPE.
   * F - fixed interest rate.
   * V - variable interest rate.
   * Space - class A loan.
   */
  get interestRateType(): string {
    return this.line.substring(40, 41).trim();
  }

  /**
   * Fixed interest rate.
   * Field: RTG-DET-FIX-RATE.
   * Legacy data type: 99V9(4).
   */
  get fixedInterestRate(): number {
    return parseCombinedDecimalString(
      +this.line.substring(41, 47),
      DECIMAL_PLACES_99V94,
    );
  }

  /**
   * Interest spread for variable interest rate.
   * For class B loans only.
   * Field: RTG-DET-VAR-RATE.
   * Legacy data type: 9V9(4).
   */
  get variableInterestSpread(): number {
    return parseCombinedDecimalString(
      +this.line.substring(47, 52),
      DECIMAL_PLACES_9V94,
    );
  }

  /**
   * Total principal outstanding of the loan at time of return.
   * Field: RTG-DET-TOT-PRINOS.
   * Legacy data type: 9(6)V99.
   */
  get totalPrincipalOutstanding(): number {
    return parseCombinedDecimalString(
      +this.line.substring(52, 60),
      DECIMAL_PLACES_96V99,
    );
  }

  /**
   * Interest owing from date.
   * Field: RTG-DET-INT-FROM-DATE.
   */
  get interestOwingFromDate(): Date {
    return this.convertToDateRecord(this.line.substring(60, 68));
  }

  /**
   * Accrued interest calculating from interest owing from date up to interest owing to date.
   * Field:RTG-DET-TOT-INTBAL.
   * Legacy data type: 9(5)V99.
   */
  get totalInterestOutstanding(): number {
    return parseCombinedDecimalString(
      +this.line.substring(68, 75),
      DECIMAL_PLACES_95V99,
    );
  }

  /**
   * Interest owing to date.
   * Field: RTG-DET-INT-TO-DATE.
   */
  get interestOwingToDate(): Date {
    return this.convertToDateRecord(this.line.substring(75, 83));
  }

  /**
   * Return reason.
   * Field: RTG-DET-RETURN-RSN.
   */
  get returnReason(): string {
    return this.line.substring(83, 87).trim();
  }

  /**
   * Date of 'Return to Government' event.
   * Field: RTG-DET-EVENT-DATE.
   */
  get returnEventDate(): Date {
    return this.convertToDateRecord(this.line.substring(87, 95));
  }

  /**
   * Date of the borrower last acknowledged the debt in writing.
   * Field: RTG-DET-ACKNW-DATE.
   */
  get debtAcknowledgementDate(): Date {
    return this.convertToDateRecord(this.line.substring(95, 103));
  }
}
