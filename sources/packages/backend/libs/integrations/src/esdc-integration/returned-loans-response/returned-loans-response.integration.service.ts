import { SFTPIntegrationBase, SshService } from "@sims/integrations/services";
import { ConfigService } from "@sims/utilities/config";
import { Injectable } from "@nestjs/common";
import { CustomNamedError } from "@sims/utilities";
import { FILE_PARSING_ERROR } from "@sims/services/constants";
import { LoggerService } from "@sims/utilities/logger";
import {
  ReturnedLoansDownloadResponse,
  ReturnedLoansResponseRecordType,
} from "@sims/integrations/esdc-integration/returned-loans-response/models/returned-loans-response.model";
import { ReturnedLoansResponseFileDetail } from "@sims/integrations/esdc-integration/returned-loans-response/returned-loans-response-files/returned-loans-response-file-detail";
import { ReturnedLoansResponseFileFooter } from "@sims/integrations/esdc-integration/returned-loans-response/returned-loans-response-files/returned-loans-response-file-footer";
import { ReturnedLoansResponseFileHeader } from "@sims/integrations/esdc-integration/returned-loans-response/returned-loans-response-files/returned-loans-response-file-header";

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
    if (header.recordType !== ReturnedLoansResponseRecordType.Header) {
      throw new CustomNamedError(
        `The returned loans response file ${remoteFilePath} has an invalid record type on header ${header.recordType}.`,
        FILE_PARSING_ERROR,
      );
    }
    // Read the last line which is the footer. After reading it, it will be removed.
    const footer = new ReturnedLoansResponseFileFooter(fileLines.pop());
    if (footer.recordType !== ReturnedLoansResponseRecordType.Footer) {
      throw new CustomNamedError(
        `The returned loans response file ${remoteFilePath} has an invalid record type on footer ${footer.recordType}.`,
        FILE_PARSING_ERROR,
      );
    }
    // Validate if the number of detail records in the footer matches the total count of detail records in the file.
    if (footer.totalDetailRecords !== fileLines.length) {
      throw new CustomNamedError(
        `The total number of detail records ${footer.totalDetailRecords} in the footer does not match the total count of detail records ${fileLines.length} in the returned loans response file ${remoteFilePath}.`,
        FILE_PARSING_ERROR,
      );
    }
    // Parse the detail records from the remaining lines in the file.
    // The first line is the header, so we start from index 2.
    const detailRecords = fileLines.map(
      (line, index) => new ReturnedLoansResponseFileDetail(line, index + 2),
    );
    return { detailRecords };
  }
}
