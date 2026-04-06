import { LoggerService } from "@sims/utilities/logger";
import { SshService } from "./ssh.service";
import * as Client from "ssh2-sftp-client";
import * as path from "path";
import { SFTPConfig } from "@sims/utilities/config";
import {
  FixedFormatFileLine,
  SFTPItemType,
} from "./sftp-integration-base.models";
import {
  END_OF_LINE,
  getFileNameAsExtendedCurrentTimestamp,
  convertToASCII,
  FILE_DEFAULT_ENCODING,
  readFirstExtractedFile,
} from "@sims/utilities";
import {
  LINE_BREAK_SPLIT_REGEX,
  SFTP_ARCHIVE_DIRECTORY,
} from "@sims/integrations/constants";
import * as unzipper from "unzipper";
import * as readline from "node:readline";
import { PassThrough } from "node:stream";

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
    protected logger: LoggerService,
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
    this.logger.log(`Uploading ${remoteFilePath}.`);
    let client: Client;
    try {
      client = await this.getClient();
      return await client.put(convertToASCII(rawContent), remoteFilePath);
    } catch (error) {
      this.logger.error(`Error uploading file ${remoteFilePath}.`, error);
      throw error;
    } finally {
      await this.ensureClientClosed(`uploading file ${remoteFilePath}`, client);
    }
  }

  /**
   * Get the list of all files waiting to be downloaded from the
   * SFTP filtering by the the regex pattern.
   * The files will be ordered by file name.
   * @param remoteDownloadFolder Remote folder to list the files.
   * @param fileRegexSearch Regex pattern to filter the files to be processed.
   * @param options Optional parameters.
   * - `itemType`: filter by item type when specified.
   * @returns file names for all response files present on SFTP.
   */
  async getResponseFilesFullPath(
    remoteDownloadFolder: string,
    fileRegexSearch: RegExp,
    options?: { itemType?: SFTPItemType },
  ): Promise<string[]> {
    this.logger.log(
      `Listing files from the remote folder ${remoteDownloadFolder}.`,
    );
    let filesToProcess: Client.FileInfo[];
    let client: Client;
    try {
      client = await this.getClient();
      filesToProcess = await client.list(
        remoteDownloadFolder,
        (item: Client.FileInfo) =>
          fileRegexSearch.test(item.name) &&
          (!options?.itemType || item.type === options.itemType),
      );
      return filesToProcess
        .map((file) => path.join(remoteDownloadFolder, file.name))
        .sort((a, b) => a.localeCompare(b));
    } catch (error) {
      this.logger.error(
        `Error listing files from ${remoteDownloadFolder}.`,
        error,
      );
      throw error;
    } finally {
      await this.ensureClientClosed(
        `listing files from ${remoteDownloadFolder}`,
        client,
      );
    }
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
    this.logger.log(`Downloading file ${remoteFilePath}.`);
    let client: Client;
    try {
      client = await this.getClient();
      if (options?.checkIfFileExist) {
        const fileExist = await client.exists(remoteFilePath);
        if (!fileExist) {
          return false;
        }
      }
      let fileContent: string;
      const fileExtension = path.extname(remoteFilePath).toLowerCase();
      const isZIPFile = fileExtension === ".zip";
      if (isZIPFile) {
        // Read the zip file content with null encoding to avoid data corruption.
        const compressedFileContent = (await client.get(
          remoteFilePath,
          undefined,
          { readStreamOptions: { encoding: null } },
        )) as Buffer;
        // Read the first file content with 'ascii' encoding.
        const { fileName, data } = readFirstExtractedFile(
          compressedFileContent,
          { encoding: FILE_DEFAULT_ENCODING },
        );
        this.logger.log(`Extracted the first file ${fileName}.`);
        fileContent = data;
      } else {
        // Read all the file content and create a buffer with 'ascii' encoding.
        fileContent = (await client.get(remoteFilePath, undefined, {
          readStreamOptions: { encoding: FILE_DEFAULT_ENCODING },
        })) as string;
      }
      // Convert the file content to an array of text lines and remove possible blank lines.
      return fileContent
        .toString()
        .split(LINE_BREAK_SPLIT_REGEX)
        .filter((line) => line.length > 0);
    } catch (error) {
      this.logger.error(`Error downloading file ${remoteFilePath}`, error);
      throw error;
    } finally {
      await this.ensureClientClosed(
        `downloading file ${remoteFilePath}`,
        client,
      );
    }
  }

  /**
   * Allow to process the file line by line as it is being downloaded, without the need to load the entire file content in memory.
   * This is specially useful for large files that can cause memory issues when loaded entirely.
   * @param remoteFilePath full remote file path with file name.
   * @param fileLineProcessor callback function to process each line of the file.
   * @returns promise that resolves when the file has been fully processed.
   */
  protected async streamResponseFileLines(
    remoteFilePath: string,
    fileLineProcessor: (line: string, progress: number) => Promise<void>,
  ): Promise<void> {
    this.logger.log(`Downloading file ${remoteFilePath}.`);
    let client: Client;
    try {
      client = await this.getClient();
      const fileExtension = path.extname(remoteFilePath).toLowerCase();
      const sftpFileStream = new PassThrough();
      // Track raw bytes as they arrive from the SFTP stream.
      let bytesReceived = 0;
      const fileStat = await client.stat(remoteFilePath);
      // Synchronously count bytes as chunks arrive — safe with event emitters.
      sftpFileStream.on("data", (chunk: Buffer) => {
        bytesReceived += chunk.length;
      });
      const downloadPromise = client.get(remoteFilePath, sftpFileStream, {
        readStreamOptions: { encoding: null },
      });
      const isZIPFile = fileExtension === ".zip";
      if (isZIPFile) {
        const zipStream = sftpFileStream.pipe(
          unzipper.Parse({ forceStream: true }),
        ) as AsyncIterable<unzipper.Entry>;
        // Read the zip file entries one by one and process file entries line by line.
        for await (const entry of zipStream) {
          if (entry.type !== "File") {
            // Allow only file entries, skip directories or other types of entries.
            // Drain the entry stream to avoid hanging the unzip process.
            entry.autodrain();
            continue;
          }
          // Read the file entry line by line without loading it entirely in memory.
          // Reads each byte till a new line is found, supporting windows line breaks (\r\n)
          // or linux based line breaks (\n).
          const nextLine = readline.createInterface({
            input: entry,
            crlfDelay: Infinity,
          });
          for await (const line of nextLine) {
            if (line.length > 0) {
              await fileLineProcessor(
                line,
                Math.round((bytesReceived / fileStat.size) * 100),
              );
            }
          }
        }
        // Wait for the download to complete before returning the file content.
        await downloadPromise;
        return;
      }
      // Non-zip: read plain text lines directly.
      const lineReader = readline.createInterface({
        input: sftpFileStream,
        crlfDelay: Infinity,
      });
      for await (const line of lineReader) {
        if (line.length > 0) {
          await fileLineProcessor(
            line,
            Math.round((bytesReceived / fileStat.size) * 100),
          );
        }
      }
      // Wait for the download to complete before returning the file content.
      await downloadPromise;
    } catch (error) {
      this.logger.error(`Error downloading file ${remoteFilePath}`, error);
      throw error;
    } finally {
      await this.ensureClientClosed(
        `downloading file ${remoteFilePath}`,
        client,
      );
    }
  }

  /**
   * When overridden in a derived class, transform the text lines
   * in parsed objects specific to the integration process.
   * It can also download raw content file when no parse is needed.
   * @param remoteFilePath full remote file path with file name.
   * @param options Optional parameters including SFTP client.
   * - `client`: SFTP client to be shared and allow multiple operations.
   * @returns The parsed download object or raw content.
   */
  async downloadResponseFile(
    remoteFilePath: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _options?: { client: Client },
  ): Promise<DownloadType> {
    throw new Error(`Method not implemented, ${remoteFilePath} not used.`);
  }

  /**
   * Renames a file on SFTP.
   * @param remoteFilePath full remote file path with file name.
   * @param newRemoteFilePath new full remote file path with file name.
   * @param options Method options.
   * - `client`: SFTP client to be used in the operation when the same
   * client is used for multiple operations.
   */
  async renameFile(
    remoteFilePath: string,
    newRemoteFilePath: string,
    options?: { client?: Client },
  ): Promise<void> {
    this.logger.log(`Renaming file ${remoteFilePath} to ${newRemoteFilePath}.`);
    let client: Client;
    try {
      client = options?.client ?? (await this.getClient());
      await client.rename(remoteFilePath, newRemoteFilePath);
    } catch (error) {
      this.logger.error(
        `Error renaming file ${remoteFilePath} to ${newRemoteFilePath}.`,
        error,
      );
      throw error;
    } finally {
      if (!options?.client) {
        // Only close the client when it was not provided in the options.
        await this.ensureClientClosed(
          `renaming file ${remoteFilePath}`,
          client,
        );
      }
    }
  }

  /**
   * Archives a file on SFTP.
   * @param remoteFilePath full remote file path with file name.
   * @param options Method options.
   * - `client`: SFTP client to be used in the operation when the same
   * client is used for multiple operations.
   * - `absoluteArchiveDirectory`: absolute archive directory to move the file to.
   */
  async archiveFile(
    remoteFilePath: string,
    options?: { client?: Client; absoluteArchiveDirectory?: string },
  ): Promise<void> {
    const fileInfo = path.parse(remoteFilePath);
    const timestamp = getFileNameAsExtendedCurrentTimestamp();
    const fileBaseName = `${fileInfo.name}_${timestamp}${fileInfo.ext}`;
    let newRemoteFilePath: string;
    if (options?.absoluteArchiveDirectory) {
      newRemoteFilePath = path.join(
        options.absoluteArchiveDirectory,
        fileBaseName,
      );
    } else {
      newRemoteFilePath = path.join(
        fileInfo.dir,
        SFTP_ARCHIVE_DIRECTORY,
        fileBaseName,
      );
    }
    await this.renameFile(remoteFilePath, newRemoteFilePath, options);
  }

  /**
   * Generates a new connected SFTP client ready to be used.
   * @returns client
   */
  async getClient(): Promise<Client> {
    return this.sshService.createClient(this.sftpConfig);
  }

  /**
   * Finalizes the SFTP client connection when initialized and
   * log a message accordingly.
   * @param context string to log with the context of the action.
   * @param client SFTP client to be finalized.
   */
  async ensureClientClosed(context: string, client?: Client): Promise<void> {
    if (client) {
      this.logger.log(`Finalizing SFTP client. Context: ${context}.`);
      await SshService.closeQuietly(client);
      this.logger.log(`SFTP client finalized. Context: ${context}.`);
      return;
    }
    this.logger.log(`SFTP client not initialized. Context: ${context}.`);
  }
}
