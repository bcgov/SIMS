import { StudentLoanBalancesFileHeader } from "../student-loan-balances-files/student-loan-balances-file-header";
import { StudentLoanBalancesFileResponse } from "../student-loan-balances-files/student-loan-balances-file-response";

export const DATE_FORMAT = "YYYYMMDD";

/**
 * Represents the parsed content of a file
 * downloaded from the SFTP response folder.
 */
export interface StudentLoanBalancesSFTPResponseFile {
  header: StudentLoanBalancesFileHeader;
  records: StudentLoanBalancesFileResponse[];
}
/**
 * Record types for a Student Loan Balances file.
 */
export enum RecordTypeCodes {
  Header = "00",
  Record = "60",
  Footer = "99",
}
