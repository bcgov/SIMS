import {
  DECIMAL_PLACES_95V99,
  DECIMAL_PLACES_96V99,
  DECIMAL_PLACES_99V94,
  DECIMAL_PLACES_9V94,
  parseCombinedDecimalNumber,
} from "@sims/utilities";
import { ReturnedLoansResponseFileDetail } from "./returned-loans-response-file-detail";
import { ReturnedLoanInterestRateType } from "../models/returned-loans-response.model";

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
   * Loan type.
   * Field: RTG-DET-LOAN-TYPE.
   */
  get loanType(): string {
    return this.line.substring(11, 13).trim();
  }

  /**
   * Type of loan agreement.
   * Field: RTG-DET-LOAN-AGMT.
   */
  get loanAgreementType(): string {
    return this.line.substring(13, 19).trim();
  }

  /**
   * Issuing province.
   * Field: RTG-DET-PROVINCE.
   */
  get issuingProvince(): string {
    return this.line.substring(19, 21).trim();
  }

  /**
   * Education institution(EI) code.
   * Field: RTG-DET-EDINST.
   */
  get educationInstitutionCode(): string {
    return this.line.substring(21, 25).trim();
  }

  /**
   * End of study date provided as month.
   * Format: YYYYMM.
   * Field: RTG-DET-PSED.
   */
  get studyEndMonth(): Date | null {
    // Month string in YYYYMM.
    const monthString = this.line.substring(25, 31) || null;
    // Convert YYYYMM to a date record by appending '01' for the day.
    return monthString ? this.convertToDateRecord(`${monthString}01`) : null;
  }

  /**
   * Loan class.
   * Field: RTG-DET-LOAN-STAT.
   */
  get loanClass(): string {
    return this.line.substring(31, 32);
  }

  /**
   * Consolidation date.
   * Field: RTG-DET-CONS-DATE.
   */
  get consolidationDate(): Date | null {
    return this.convertToDateRecord(this.line.substring(32, 40));
  }

  /**
   * Interest rate type.
   * Field: RTG-DET-INT-RATE-TYPE.
   * F - fixed interest rate.
   * V - variable interest rate.
   * Space - class A loan.
   */
  get interestRateType(): ReturnedLoanInterestRateType {
    return this.line.substring(40, 41).trim() as ReturnedLoanInterestRateType;
  }

  /**
   * Fixed interest rate.
   * Field: RTG-DET-FIX-RATE.
   * Legacy data type: 99V9(4).
   */
  get fixedInterestRate(): number {
    return parseCombinedDecimalNumber(
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
    return parseCombinedDecimalNumber(
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
    return parseCombinedDecimalNumber(
      +this.line.substring(52, 60),
      DECIMAL_PLACES_96V99,
    );
  }

  /**
   * Interest owing from date.
   * Field: RTG-DET-INT-FROM-DATE.
   */
  get interestOwingFromDate(): Date | null {
    return this.convertToDateRecord(this.line.substring(60, 68));
  }

  /**
   * Accrued interest calculating from interest owing from date up to interest owing to date.
   * Field: RTG-DET-TOT-INTBAL.
   * Legacy data type: 9(5)V99.
   */
  get totalInterestOutstanding(): number {
    return parseCombinedDecimalNumber(
      +this.line.substring(68, 75),
      DECIMAL_PLACES_95V99,
    );
  }

  /**
   * Interest owing to date.
   * Field: RTG-DET-INT-TO-DATE.
   */
  get interestOwingToDate(): Date | null {
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
  get returnEventDate(): Date | null {
    return this.convertToDateRecord(this.line.substring(87, 95));
  }

  /**
   * Date the borrower last acknowledged the debt in writing.
   * Field: RTG-DET-ACKNW-DATE.
   */
  get debtAcknowledgementDate(): Date | null {
    return this.convertToDateRecord(this.line.substring(95, 103));
  }

  /**
   * Validates the returned loan detail fields.
   * @returns validation errors as an array of strings.
   */
  validate(): string[] {
    // Get validation errors from the parent class.
    const errors: string[] = super.validate();
    if (!this.returnReason) {
      errors.push("Invalid return reason");
    }
    if (Number.isNaN(this.totalPrincipalOutstanding)) {
      errors.push("Invalid total principal outstanding");
    }
    if (Number.isNaN(this.totalInterestOutstanding)) {
      errors.push("Invalid total interest outstanding");
    }
    // As we are not expecting class A loans, only fixed and variable interest rate types are expected.
    if (
      ![
        ReturnedLoanInterestRateType.Fixed,
        ReturnedLoanInterestRateType.Variable,
      ].includes(this.interestRateType)
    ) {
      errors.push("Invalid interest rate type");
    }
    if (
      this.interestRateType === ReturnedLoanInterestRateType.Fixed &&
      Number.isNaN(this.fixedInterestRate)
    ) {
      errors.push("Invalid fixed interest rate");
    }
    if (
      this.interestRateType === ReturnedLoanInterestRateType.Variable &&
      Number.isNaN(this.variableInterestSpread)
    ) {
      errors.push("Invalid variable interest spread");
    }
    return errors;
  }
}
