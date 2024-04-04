import { SFTPIntegrationBase, SshService } from "@sims/integrations/services";
import {
  RecordTypeCodes,
  StudentLoanBalancesSFTPResponseFile,
} from "./models/student-loan-balances.model";
import { ConfigService } from "@sims/utilities/config";
import { Injectable } from "@nestjs/common";
import { StudentLoanBalancesFileHeader } from "./student-loan-balances-files/student-loan-balances-file-header";
import { StudentLoanBalancesFileFooter } from "./student-loan-balances-files/student-loan-balances-file-footer";
import { StudentLoanBalancesFileResponse } from "./student-loan-balances-files/student-loan-balances-file-response";
import { CustomNamedError } from "@sims/utilities";
import {
  STUDENT_LOAN_BALANCE_INVALID_FILE_FOOTER,
  STUDENT_LOAN_BALANCE_INVALID_FILE_HEADER,
  STUDENT_LOAN_BALANCE_RECORDS_MISMATCH,
} from "@sims/services/constants";

@Injectable()
export class StudentLoanBalancesIntegrationService extends SFTPIntegrationBase<StudentLoanBalancesSFTPResponseFile> {
  constructor(config: ConfigService, sshService: SshService) {
    super(config.zoneBSFTP, sshService);
  }

  /**
   * Downloads the file specified on 'remoteFilePath' parameter from the
   * Student loan balances file on the SFTP.
   * @param remoteFilePath full remote file path with file name.
   * @returns parsed records from the file.
   */
  async downloadResponseFile(
    remoteFilePath: string,
  ): Promise<StudentLoanBalancesSFTPResponseFile> {
    const fileLines = await this.downloadResponseFileLines(remoteFilePath);
    // Read the first line to check if the header code is the expected one.
    const header = StudentLoanBalancesFileHeader.createFromLine(
      fileLines.shift(),
    ); // Read and remove header.
    if (header.recordTypeCode !== RecordTypeCodes.Header) {
      this.logger.error(
        `The Student loan balances file ${remoteFilePath} has an invalid record type on header: ${header.recordTypeCode}.`,
      );
      // If the header is not the expected one, throw an error.
      throw new CustomNamedError(
        `Invalid record type ${header.recordTypeCode} on header.`,
        STUDENT_LOAN_BALANCE_INVALID_FILE_HEADER,
      );
    }
    // Remove the footer.
    // Not part of the processing.
    const footer = StudentLoanBalancesFileFooter.createFromLine(
      fileLines.pop(),
    );
    if (footer.recordTypeCode !== RecordTypeCodes.Footer) {
      this.logger.error(
        `The Student loan balances file ${remoteFilePath} has an invalid record type on footer: ${footer.recordTypeCode}.`,
      );
      // If the footer is not the expected one, throw an error.
      throw new CustomNamedError(
        `Invalid record type ${footer.recordTypeCode} on footer.`,
        STUDENT_LOAN_BALANCE_INVALID_FILE_FOOTER,
      );
    }
    if (footer.recordCount !== fileLines.length) {
      this.logger.error(
        `The number of Student loan balance records ${fileLines.length} does not match the records in the footer ${footer.recordCount}.`,
      );
      // If the footer is not the expected one, throw an error.
      throw new CustomNamedError(
        "Records in footer does not match the number of records.",
        STUDENT_LOAN_BALANCE_RECORDS_MISMATCH,
      );
    }
    // Generate the records.
    const records = fileLines.map(
      // 1 is the header already removed.
      (line, index) => new StudentLoanBalancesFileResponse(line, index + 2),
    );
    return { header, records };
  }
}
