import { Injectable } from "@nestjs/common";
import { ConfigService } from "@sims/utilities/config";
import { SFTPIntegrationBase, SshService } from "@sims/integrations/services";
import { ECEResponseFileDetail } from "./ece-files/ece-response-file-detail";
import { ECEResponseFileHeader } from "./ece-files/ece-response-file-header";
import { RecordTypeCodes } from "./models/ece-integration.model";
import { ECEResponseFileFooter } from "./ece-files/ece-response-file-footer";
import { CustomNamedError } from "@sims/utilities";
import {
  FILE_PARSING_ERROR,
  UNEXPECTED_ERROR_DOWNLOADING_FILE,
} from "@sims/services/constants";

@Injectable()
export class ECEResponseIntegrationService extends SFTPIntegrationBase<
  ECEResponseFileDetail[]
> {
  constructor(config: ConfigService, sshService: SshService) {
    super(config.zoneBSFTP, sshService);
    this.logger.setContext(ECEResponseIntegrationService.name);
  }

  /**
   * Downloads the file specified on {@link remoteFilePath} from the
   * Institution response integration folder on the SFTP.
   * @param remoteFilePath full remote file path with file name.
   * @returns parsed records from the file.
   */
  async downloadResponseFile(
    remoteFilePath: string,
  ): Promise<ECEResponseFileDetail[]> {
    let fileLines: string[];
    try {
      fileLines = await this.downloadResponseFileLines(remoteFilePath);
    } catch (error: unknown) {
      this.logger.error(error);
      throw new CustomNamedError(
        "Unexpected error while downloading the integration file.",
        UNEXPECTED_ERROR_DOWNLOADING_FILE,
      );
    }

    try {
      // The file is not expected to be empty without content.
      if (!fileLines.length) {
        const error = "The ECE response file is empty and cannot be processed.";
        this.logger.error(error);
        throw new Error(error);
      }
      // Read the first line to check if the header record type is the expected one.
      const header = new ECEResponseFileHeader(fileLines.shift()); // Read and remove header.
      if (header.recordType !== RecordTypeCodes.ECEHeader) {
        const error = `The ECE response file has an invalid record type on header: ${header.recordType}`;
        this.logger.error(error);
        // If the header is not the expected one, throw an error.
        throw new Error(error);
      }
      // Read the last line to check if the footer record type is the expected one.
      const footer = new ECEResponseFileFooter(fileLines.pop());
      if (footer.recordType !== RecordTypeCodes.ECETrailer) {
        const error = `The ECE response file has an invalid record type on footer: ${footer.recordType}`;
        this.logger.error(error);
        // If the footer is not the expected one.
        throw new Error(error);
      }
      // The file is expected to have at least one detail record.
      if (!fileLines.length) {
        const error =
          "The ECE response file does not have any detail records to process.";
        this.logger.error(error);
        throw new Error(error);
      }
      // The total count of detail records is mentioned in the footer record and it is expected to
      // match the actual count of total records.
      if (fileLines.length !== footer.totalDetailRecords) {
        const error =
          "The total count of detail records mentioned in the footer record does not match with the actual total details records count.";
        this.logger.error(error);
        throw new Error(error);
      }
      const records: ECEResponseFileDetail[] = [];
      fileLines.forEach((line, index) => {
        const record = new ECEResponseFileDetail(line, index + 2);
        records.push(record);
      });
      return records;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new CustomNamedError(error.message, FILE_PARSING_ERROR);
      }
      this.logger.error(error);
      throw new CustomNamedError(
        "Unexpected error while parsing the ECE file",
        FILE_PARSING_ERROR,
      );
    }
  }
}
