import {
  DATE_FORMAT,
  RecordTypeCodes,
} from "../models/student-loan-balances.model";
import { getDateOnlyFromFormat } from "@sims/utilities";

/**
 * Header of the Student Loan Balances file.
 */
export class StudentLoanBalancesFileHeader {
  /**
   * Record type code of the line.
   */
  recordTypeCode: RecordTypeCodes;
  /**
   * Month end balance end date of the line.
   */
  balanceDate: Date;

  /**
   * Reads a fixed line format to convert the data.
   * @param line fixed line formatted.
   * @returns file header.
   */
  static createFromLine(line?: string): StudentLoanBalancesFileHeader {
    const header = new StudentLoanBalancesFileHeader();
    header.recordTypeCode = line.substring(0, 2) as RecordTypeCodes;
    header.balanceDate = getDateOnlyFromFormat(
      line.substring(21, 28),
      DATE_FORMAT,
    );
    return header;
  }
}
