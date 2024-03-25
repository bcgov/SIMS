import { RecordTypeCodes } from "../models/student-loan-balances.model";

/**
 * Footer of the Student Loan Balances file.
 */
export class StudentLoanBalancesFileFooter {
  /**
   * File record type.
   */
  recordTypeCode: RecordTypeCodes;
  /**
   * Total records in the file (dos not include header and footer).
   */
  recordCount: number;
  /**
   * Reads a fixed line format to convert the data.
   * @param line fixed line formatted.
   * @returns file footer.
   */
  static createFromLine(line?: string): StudentLoanBalancesFileFooter {
    const footer = new StudentLoanBalancesFileFooter();
    footer.recordTypeCode = line.substring(0, 2) as RecordTypeCodes;
    footer.recordCount = +line.substring(2, 8);
    return footer;
  }
}
