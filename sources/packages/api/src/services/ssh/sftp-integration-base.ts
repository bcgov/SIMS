import { InjectLogger } from "../../common";
import { LoggerService } from "../../logger/logger.service";
import { SshService } from "./ssh.service";
import * as Client from "ssh2-sftp-client";
import { SFTPConfig } from "../../types";
import { FixedFormatFileLine } from "./sftp-integration-base.models";

/**
 * Provides the basic features to enable the SFTP integration.
 */
export abstract class SFTPIntegrationBase<DownloadType> {
  constructor(
    private readonly sftpConfig: SFTPConfig,
    private readonly sshService: SshService,
    private readonly sftpInputFileRegexSearch: RegExp,
    private readonly sftpInputFolder: string,
    private readonly sftpOutputFolder?: string,
  ) {}

  /**
   * Converts the fileLines to the final content and upload it.
   * @param fileLines Array of lines to be converted to a formatted fixed size file.
   * @param fileName file name to be uploaded.
   * @returns Upload result.
   */
  async uploadContent(
    fileLines: FixedFormatFileLine[],
    fileName: string,
  ): Promise<string> {
    // Generate fixed formatted file.
    const fixedFormattedLines: string[] = fileLines.map((line) =>
      line.getFixedFormat(),
    );
    const fileContent = fixedFormattedLines.join("\r\n");

    // Send the file to ftp.
    this.logger.log("Creating new SFTP client to start upload...");
    const client = await this.getClient();
    try {
      const remoteFilePath = this.getOutputFullFilePath(fileName);
      this.logger.log(`Uploading ${remoteFilePath}`);
      return await client.put(Buffer.from(fileContent), remoteFilePath);
    } finally {
      this.logger.log("Finalizing SFTP client...");
      await SshService.closeQuietly(client);
      this.logger.log("SFTP client finalized.");
    }
  }

  /**
   * Get the list of all files waiting to be downloaded from the
   * SFTP filtering by the the regex pattern.
   * The files will be ordered by file name.
   * @returns file names for all response files present on SFTP.
   */
  async getResponseFilesFullPath(): Promise<string[]> {
    let filesToProcess: Client.FileInfo[];
    const client = await this.getClient();
    try {
      filesToProcess = await client.list(
        `${this.sftpInputFolder}`,
        this.sftpInputFileRegexSearch,
      );
    } finally {
      await SshService.closeQuietly(client);
    }

    return filesToProcess.map((file) => file.name).sort();
  }

  protected getInputFullFilePath(fileName: string): string {
    return `${this.sftpInputFolder}/${fileName}`;
  }

  protected getOutputFullFilePath(fileName: string): string {
    if (this.sftpOutputFolder) {
      throw new Error("Output folder is not configured.");
    }
    return `${this.sftpOutputFolder}/${fileName}`;
  }

  /**
   * Downloads the file specified on 'fileName' parameter from the
   * SFAS integration folder on the SFTP.
   * @param fileName name of the file to be downloaded.
   * @returns parsed records from the file.
   */
  protected async downloadResponseFileLines(
    fileName: string,
  ): Promise<string[]> {
    const client = await this.getClient();
    try {
      const filePath = this.getInputFullFilePath(fileName);
      // Read all the file content and create a buffer.
      const fileContent = await client.get(filePath);
      // Convert the file content to an array of text lines and remove possible blank lines.
      return fileContent
        .toString()
        .split(/\r\n|\n\r|\n|\r/)
        .filter((line) => line.length > 0);
    } finally {
      await SshService.closeQuietly(client);
    }
  }

  abstract downloadResponseFile(fileName: string): Promise<DownloadType>;

  /**
   * Delete a file from SFTP.
   * @param fileName name of the file to be deleted.
   */
  async deleteFile(fileName: string): Promise<void> {
    const filePath = this.getInputFullFilePath(fileName);
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
    return this.sshService.createClient(this.sftpConfig);
  }

  @InjectLogger()
  logger: LoggerService;
}
