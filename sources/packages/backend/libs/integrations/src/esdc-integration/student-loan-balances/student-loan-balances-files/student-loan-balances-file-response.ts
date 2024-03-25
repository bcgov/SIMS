import {
  DATE_FORMAT,
  RecordTypeCodes,
} from "../models/student-loan-balances.model";
import { getDateOnlyFromFormat } from "@sims/utilities";

/**
 * File response record of the Student Loan Balances file.
 */
export class StudentLoanBalancesFileResponse {
  constructor(
    public readonly line: string,
    public readonly lineNumber: number,
  ) {}

  /**
   * Record type code of the line.
   */
  get recordTypeCode(): RecordTypeCodes {
    return this.line.substring(0, 2) as RecordTypeCodes;
  }
  /**
   * SIN of the student to match and update the student loan balance.
   */
  get sin(): string {
    return this.line.substring(2, 10);
  }
  /**
   * Last name of the student to match and update the student loan balance.
   */
  get lastName(): string {
    return this.line.substring(20, 69);
  }
  /**
   * Date of birth of the student to match and update the student loan balance.
   */
  get birthDate(): Date {
    return getDateOnlyFromFormat(this.line.substring(91, 98), DATE_FORMAT);
  }
  /**
   * Date of birth of the student to match and update the student loan balance.
   */
  get cslBalance(): number {
    return +this.line.substring(13, 19);
  }
}
