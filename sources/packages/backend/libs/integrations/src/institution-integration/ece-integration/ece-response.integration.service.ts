import { Injectable } from "@nestjs/common";
import { ConfigService } from "@sims/utilities/config";
import { SFTPIntegrationBase, SshService } from "@sims/integrations/services";
import { ECEResponseFileDetail } from "./ece-files/ece-response-file-detail";
import { ECEResponseFileHeader } from "./ece-files/ece-response-file-header";
import { RecordTypeCodes } from "./models/ece-integration.model";
import { ECEResponseFileFooter } from "./ece-files/ece-response-file-footer";

@Injectable()
export class ECEResponseIntegrationService extends SFTPIntegrationBase<
  ECEResponseFileDetail[]
> {
  constructor(config: ConfigService, sshService: SshService) {
    super(config.zoneBSFTP, sshService);
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
    const fileLines = await this.downloadResponseFileLines(remoteFilePath);
    // Read the first line to check if the header record type is the expected one.
    const header = new ECEResponseFileHeader(fileLines.shift()); // Read and remove header.
    if (header.recordType !== RecordTypeCodes.ECEHeader) {
      const error = `The ECE response file ${remoteFilePath} has an invalid record type on header: ${header.recordType}`;
      this.logger.error(error);
      // If the header is not the expected one, throw an error.
      throw new Error(error);
    }
    //Read the last line to check if the footer record type is the expected one.
    const footer = new ECEResponseFileFooter(fileLines.pop());
    if (footer.recordType !== RecordTypeCodes.ECETrailer) {
      const error = `The ECE response file ${remoteFilePath} has an invalid record type on footer: ${footer.recordType}`;
      this.logger.error(error);
      // If the footer is not the expected one.
      throw new Error(error);
    }
    // The file is expected to have at least one detail record.
    if (!fileLines.length) {
      const error = `The ECE response file ${remoteFilePath} does not have any detail records to process.`;
      this.logger.error(error);
      throw new Error(error);
    }
    // The total count of detail records is mentioned in the footer record and it is expected to
    // match the actual count of total records.
    if (fileLines.length !== footer.totalDetailRecords) {
      const error = `In ${remoteFilePath} the total count of detail records mentioned in the footer record does not match with the actual total details records count.`;
      this.logger.error(error);
      throw new Error(error);
    }
    const records: ECEResponseFileDetail[] = [];
    fileLines.forEach((line, index) => {
      const record = new ECEResponseFileDetail(line, index + 1);
      records.push(record);
    });
    return records;
  }
}
