import { InjectLogger } from "../common";
import { LoggerService } from "../logger/logger.service";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "../services";
import { SshService } from "../services/ssh/ssh.service";
import * as Client from "ssh2-sftp-client";
import { SFASIntegrationConfig, SFTPConfig } from "../types";
import { SFASRecordIdentification } from "./sfas-files/sfas-record-identification";
import { DownloadResult, RecordTypeCodes } from "./sfas-integration.models";
import { SFASHeader } from "./sfas-files/sfas-header";

@Injectable()
export class SFASIntegrationService {
  private readonly sfasConfig: SFASIntegrationConfig;
  private readonly ftpConfig: SFTPConfig;

  constructor(config: ConfigService, private readonly sshService: SshService) {
    this.sfasConfig = config.getConfig().SFASIntegrationConfig;
    this.ftpConfig = config.getConfig().zoneBSFTP;
  }

  /**
   * Get the list of all files waiting to be downloaded from the
   * SFTP filtering by the the regex pattern '/SFAS-TO-SIMS-[\w]*\.txt/i'.
   * The files must be ordered by file name.
   * @returns file names for all response files present on SFTP.
   */
  async getResponseFilesFullPath(): Promise<string[]> {
    let filesToProcess: Client.FileInfo[];
    const client = await this.getClient();
    try {
      filesToProcess = await client.list(
        `${this.sfasConfig.ftpReceiveFolder}`,
        /SFAS-TO-SIMS-[\w]*-[\w]*\.txt/i,
      );
    } finally {
      await SshService.closeQuietly(client);
    }

    return filesToProcess.map((file) => file.name).sort();
  }

  private getFullFilePath(fileName: string): string {
    return `${this.sfasConfig.ftpReceiveFolder}/${fileName}`;
  }

  /**
   * Downloads the file specified on 'fileName' parameter from the
   * SFAS integration folder on the SFTP.
   * @param fileName name of the file to be downloaded.
   * @returns parsed records from the file.
   */
  async downloadResponseFile(fileName: string): Promise<DownloadResult> {
    const client = await this.getClient();
    try {
      const filePath = this.getFullFilePath(fileName);
      // Read all the file content and create a buffer.
      const fileContent = await client.get(filePath);
      // Convert the file content to an array of text lines and remove possible blank lines.
      const fileLines = fileContent
        .toString()
        .split(/\r\n|\n\r|\n|\r/)
        .filter((line) => line.length > 0);
      // Read the first line to check if the header code is the expected one.
      const header = new SFASHeader(fileLines.shift()); // Read and remove header.
      if (header.recordType !== RecordTypeCodes.Header) {
        this.logger.error(
          `The SFAS file ${fileName} has an invalid transaction code on header: ${header.recordType}`,
        );
        // If the header is not the expected one, just ignore the file.
        return null;
      }

      // Remove the footer.
      // Not part of the processing.
      fileLines.pop();

      // Generate the records.
      let lineNumber = 2; // 1 is the header already removed.
      const records = fileLines.map(
        (line) => new SFASRecordIdentification(line, lineNumber++),
      );

      return {
        header,
        records,
      };
    } finally {
      await SshService.closeQuietly(client);
    }
  }

  /**
   * Delete a file from SFTP.
   * @param fileName name of the file to be deleted.
   */
  async deleteFile(fileName: string): Promise<void> {
    const filePath = this.getFullFilePath(fileName);
    const client = await this.getClient();
    try {
      await client.delete(filePath);
    } finally {
      await SshService.closeQuietly(client);
    }
  }

  /**
   * Generates a new connected SFTP client ready to be used.
   * @returns client
   */
  private async getClient(): Promise<Client> {
    return this.sshService.createClient(this.ftpConfig);
  }

  @InjectLogger()
  logger: LoggerService;
}
