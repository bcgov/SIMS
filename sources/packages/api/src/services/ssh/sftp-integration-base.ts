import { InjectLogger } from "../../common";
import { LoggerService } from "../../logger/logger.service";
import { SshService } from "./ssh.service";
import { SFTPConfig } from "../../types";
import { FixedFormatFileLine } from "./sftp-integration-base.models";
import * as Client from "ssh2-sftp-client";
import * as path from "path";
import { ECertFileHeader } from "src/esdc-integration/e-cert-integration/e-cert-files/e-cert-file-header";
import { ECertFileFooter } from "src/esdc-integration/e-cert-integration/e-cert-files/e-cert-file-footer";

/**
 * Provides the basic features to enable the SFTP integration.
 */
export abstract class SFTPIntegrationBase<DownloadType> {
  /**
   * Initializes a new instance of the SFTPIntegrationBase.
   * @param sftpConfig configuration to connect to the SFTP.
   * @param sshService service responsible to connect and execute SFTP commands.
   */
  constructor(
    private readonly sftpConfig: SFTPConfig,
    private readonly sshService: SshService,
  ) {}

  /**
   * Converts the fileLines to the final content and upload it.
   * @param fileLines Array of lines to be converted to a formatted fixed size file.
   * @param remoteFilePath full remote file path with file name.
   * @returns Upload result.
   */
  async uploadContent(
    fileLines: FixedFormatFileLine[],
    remoteFilePath: string,
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
  async getResponseFilesFullPath(
    remoteDownloadFolder: string,
    fileRegexSearch: RegExp,
  ): Promise<string[]> {
    let filesToProcess: Client.FileInfo[];
    const client = await this.getClient();
    try {
      filesToProcess = await client.list(remoteDownloadFolder, fileRegexSearch);
    } finally {
      await SshService.closeQuietly(client);
    }

    return filesToProcess
      .map((file) => path.join(remoteDownloadFolder, file.name))
      .sort();
  }

  /**
   * Downloads the file specified on 'fileName' parameter from the
   * SFAS integration folder on the SFTP.
   * @param remoteFilePath full remote file path with file name.
   * @returns parsed records from the file.
   */
  protected async downloadResponseFileLines(
    remoteFilePath: string,
  ): Promise<string[]> {
    const client = await this.getClient();
    try {
      // Read all the file content and create a buffer.
      const fileContent = await client.get(remoteFilePath);
      // Convert the file content to an array of text lines and remove possible blank lines.
      return fileContent
        .toString()
        .split(/\r\n|\n\r|\n|\r/)
        .filter((line) => line.length > 0);
    } finally {
      await SshService.closeQuietly(client);
    }
  }

  /**
   * When overridden in a derived class, transform the text lines
   * in parsed objects specific to the integration process.
   * @param remoteFilePath full remote file path with file name.
   */
  abstract downloadResponseFile(remoteFilePath: string): Promise<DownloadType>;

  /**
   * Delete a file from SFTP.
   * @param remoteFilePath full remote file path with file name.
   */
  async deleteFile(remoteFilePath: string): Promise<void> {
    const client = await this.getClient();
    try {
      await client.delete(remoteFilePath);
    } finally {
      await SshService.closeQuietly(client);
    }
  }

  /**
   * Generates a new connected SFTP client ready to be used.
   * @returns client
   */
  public async getClient(): Promise<Client> {
    return this.sshService.createClient(this.sftpConfig);
  }

  @InjectLogger()
  logger: LoggerService;
}
