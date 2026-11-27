import { SFTPIntegrationBase, SshService } from "@sims/integrations/services";
import { ConfigService } from "@sims/utilities/config";
import { Injectable } from "@nestjs/common";
import { CustomNamedError } from "@sims/utilities";
import { FILE_PARSING_ERROR } from "@sims/services/constants";
import { LoggerService } from "@sims/utilities/logger";
import {
  ReturnedLoansDownloadResponse,
  ReturnedLoansResponseRecordType,
} from "./models/returned-loans-response.model";

import {
  ReturnedLoansResponseFileDetail,
  ReturnedLoansResponseFileFooter,
  ReturnedLoansResponseFileHeader,
  ReturnedLoansResponseFileAddressDetail,
  ReturnedLoansResponseFileReturnedLoanDetail,
} from "./returned-loans-response-files";

@Injectable()
export class ReturnedLoansResponseIntegrationService extends SFTPIntegrationBase<ReturnedLoansDownloadResponse> {
  constructor(
    config: ConfigService,
    sshService: SshService,
    logger: LoggerService,
  ) {
    super(config.zoneBSFTP, sshService, logger);
  }

  /**
   * Download the returned loans response file from the path {@link remoteFilePath}.
   * @param remoteFilePath full remote file path with file name.
   * @returns parsed file records.
   */
  async downloadResponseFile(
    remoteFilePath: string,
  ): Promise<ReturnedLoansDownloadResponse> {
    const fileLines = await this.downloadResponseFileLines(remoteFilePath);
    // Read the first line which is the header. After reading it, it will be removed.
    const header = new ReturnedLoansResponseFileHeader(fileLines.shift());
    // Validate the header record type.
    const headerValidationErrors = header.validate();
    if (headerValidationErrors.length) {
      throw new CustomNamedError(
        `Header validation failed for file ${remoteFilePath}. Errors: ${headerValidationErrors.join(", ")}.`,
        FILE_PARSING_ERROR,
      );
    }
    // Read the last line which is the footer. After reading it, it will be removed.
    const footer = new ReturnedLoansResponseFileFooter(fileLines.pop());
    const footerValidationErrors = footer.validate({
      actualTotalDetailRecords: fileLines.length,
    });
    if (footerValidationErrors.length) {
      throw new CustomNamedError(
        `Footer validation failed for file ${remoteFilePath}. Errors: ${footerValidationErrors.join(", ")}.`,
        FILE_PARSING_ERROR,
      );
    }
    // Parse the address and returned loan detail records from the remaining lines in the file.
    const addressDetailRecords: ReturnedLoansResponseFileAddressDetail[] = [];
    const returnedLoanDetailRecords: ReturnedLoansResponseFileReturnedLoanDetail[] =
      [];
    const unknownRecords: ReturnedLoansResponseFileDetail[] = [];
    fileLines.forEach((line, index) => {
      // The first line is the header and index starts from 0, so we start from index 2 indicating the actual line number in the file.
      const lineNumber = index + 2;
      const detailRecord = new ReturnedLoansResponseFileDetail(
        line,
        lineNumber,
      );
      switch (detailRecord.recordType) {
        case ReturnedLoansResponseRecordType.AddressDetail:
          addressDetailRecords.push(
            new ReturnedLoansResponseFileAddressDetail(line, lineNumber),
          );
          break;
        case ReturnedLoansResponseRecordType.ReturnedLoanDetail:
          returnedLoanDetailRecords.push(
            new ReturnedLoansResponseFileReturnedLoanDetail(line, lineNumber),
          );
          break;
        default:
          unknownRecords.push(detailRecord);
          break;
      }
    });
    return { addressDetailRecords, returnedLoanDetailRecords, unknownRecords };
  }
}
