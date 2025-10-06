import { LoggerService } from "@sims/utilities/logger";
import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@sims/utilities/config";
import { SFASRecordIdentification } from "./sfas-files/sfas-record-identification";
import { DownloadResult, RecordTypeCodes } from "./sfas-integration.models";
import { SFASHeader } from "./sfas-files/sfas-header";
import { SFTPIntegrationBase, SshService } from "@sims/integrations/services";

@Injectable()
export class SFASIntegrationService extends SFTPIntegrationBase<DownloadResult> {
  constructor(config: ConfigService, sshService: SshService) {
    super(config.zoneBSFTP, sshService);
  }

  /**
   * Downloads the file specified on 'remoteFilePath' parameter from the
   * SFAS integration folder on the SFTP.
   * @param remoteFilePath full remote file path with file name.
   * @returns parsed records from the file.
   */
  async downloadResponseFile(remoteFilePath: string): Promise<DownloadResult> {
    const fileLines = await this.downloadResponseFileLines(remoteFilePath);
    // Read the first line to check if the header code is the expected one.
    const header = new SFASHeader(fileLines.shift()); // Read and remove header.
    if (header.recordType !== RecordTypeCodes.Header) {
      this.logger.error(
        `The SFAS file ${remoteFilePath} has an invalid transaction code on header: ${header.recordType}`,
      );
      // If the header is not the expected one, throw an error.
      throw new Error("Invalid file header.");
    }

    // Remove the footer.
    // Not part of the processing.
    fileLines.pop();

    // Generate the records.
    const records = fileLines.map(
      // 1 is the header already removed.
      (line, index) => new SFASRecordIdentification(line, index + 2),
    );

    return {
      header,
      records,
    };
  }

  @Inject(LoggerService)
  declare logger: LoggerService;
}
