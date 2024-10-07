import { LoggerService, InjectLogger } from "@sims/utilities/logger";
import { SshService } from "./ssh.service";
import * as Client from "ssh2-sftp-client";
import * as path from "path";
import { SFTPConfig } from "@sims/utilities/config";
import { FixedFormatFileLine } from "./sftp-integration-base.models";
import {
  END_OF_LINE,
  getFileNameAsExtendedCurrentTimestamp,
  translateToASCII,
} from "@sims/utilities";
import { FILE_DEFAULT_ENCODING } from "@sims/services/constants";
import { LINE_BREAK_SPLIT_REGEX } from "@sims/integrations/constants";

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
    const fileContent = fixedFormattedLines.join(END_OF_LINE);
    return this.uploadRawContent(fileContent, remoteFilePath);
  }

  /**
   * Converts the fileLines to the final content and upload it.
   * @param rawContent Raw content in string format.
   * @param remoteFilePath full remote file path with file name.
   * @returns Upload result.
   */
  async uploadRawContent(
    rawContent: string,
    remoteFilePath: string,
  ): Promise<string> {
    // Send the file to ftp.
    this.logger.log("Creating new SFTP client to start upload...");
    const client = await this.getClient();
    try {
      this.logger.log(`Uploading ${remoteFilePath}`);
      return await client.put(translateToASCII(rawContent), remoteFilePath);
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
      filesToProcess = await client.list(
        remoteDownloadFolder,
        (item: Client.FileInfo) => fileRegexSearch.test(item.name),
      );
    } finally {
      await SshService.closeQuietly(client);
    }

    return filesToProcess
      .map((file) => path.join(remoteDownloadFolder, file.name))
      .sort((a, b) => a.localeCompare(b));
  }

  /**
   * Downloads the file specified on 'fileName' parameter from the
   * SFAS integration folder on the SFTP.
   * @param remoteFilePath full remote file path with file name.
   * @returns parsed records from the file.
   */
  protected async downloadResponseFileLines(
    remoteFilePath: string,
  ): Promise<string[]>;

  /**
   * Downloads the file specified on 'fileName' parameter from the
   * SFAS integration folder on the SFTP.
   * @param remoteFilePath full remote file path with file name.
   * @param options download file options.
   * -  `checkIfFileExist` when set to true, check if file exist before downloading it.
   * @returns parsed records from the file.
   */
  protected async downloadResponseFileLines(
    remoteFilePath: string,
    options: { checkIfFileExist: boolean },
  ): Promise<string[] | false>;

  /**
   * Downloads the file specified on 'fileName' parameter from the
   * SFAS integration folder on the SFTP.
   * @param remoteFilePath full remote file path with file name.
   * @param options download file options.
   * -  `checkIfFileExist` when set to true, check if file exist before downloading it.
   * @returns parsed records from the file.
   */
  protected async downloadResponseFileLines(
    remoteFilePath: string,
    options?: { checkIfFileExist: boolean },
  ): Promise<string[] | false> {
    const client = await this.getClient();
    try {
      if (options?.checkIfFileExist) {
        const fileExist = await client.exists(remoteFilePath);
        if (!fileExist) {
          return false;
        }
      }
      // Read all the file content and create a buffer with 'ascii' encoding.
      const fileContent = await client.get(remoteFilePath, undefined, {
        readStreamOptions: { encoding: FILE_DEFAULT_ENCODING },
      });
      // Convert the file content to an array of text lines and remove possible blank lines.
      return fileContent
        .toString()
        .split(LINE_BREAK_SPLIT_REGEX)
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
  downloadResponseFile(remoteFilePath: string): Promise<DownloadType> {
    throw new Error(`Method not implemented, ${remoteFilePath} not used.`);
  }

  /**
   * Renames a file on SFTP .
   * @param remoteFilePath full remote file path with file name.
   * @param newRemoteFilePath new full remote file path with file name.
   */
  async renameFile(
    remoteFilePath: string,
    newRemoteFilePath: string,
  ): Promise<void> {
    const client = await this.getClient();
    try {
      await client.rename(remoteFilePath, newRemoteFilePath);
    } finally {
      await SshService.closeQuietly(client);
    }
  }

  /**
   * Archives a file on SFTP .
   * @param remoteFilePath full remote file path with file name.
   * @param archiveDirectory directory name to archive the file.
   */
  async archiveFile(
    remoteFilePath: string,
    archiveDirectory: string,
  ): Promise<void> {
    const fileInfo = path.parse(remoteFilePath);
    const timestamp = getFileNameAsExtendedCurrentTimestamp();
    const fileBaseName = `${fileInfo.name}_${timestamp}${fileInfo.ext}`;
    const newRemoteFilePath = path.join(
      fileInfo.dir,
      archiveDirectory,
      fileBaseName,
    );
    await this.renameFile(remoteFilePath, newRemoteFilePath);
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
