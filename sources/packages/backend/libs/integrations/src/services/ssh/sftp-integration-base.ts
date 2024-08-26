import { LoggerService, InjectLogger } from "@sims/utilities/logger";
import { SshService } from "./ssh.service";
import * as Client from "ssh2-sftp-client";
import * as path from "path";
import { SFTPConfig } from "@sims/utilities/config";
import { FixedFormatFileLine } from "./sftp-integration-base.models";
import { END_OF_LINE } from "@sims/utilities";
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
      return await client.put(
        this.convertRawContent(rawContent),
        remoteFilePath,
      );
    } finally {
      this.logger.log("Finalizing SFTP client...");
      await SshService.closeQuietly(client);
      this.logger.log("SFTP client finalized.");
    }
  }

  /**
   * Converts input into an ASCII 7 bit buffer.
   * @param rawContent Raw content in string format.
   * @returns a buffer of the input with extended ASCII accented characters converted to unaccented characters.
   */
  private convertRawContent(rawContent: string): Buffer {
    const content = Buffer.from(rawContent, FILE_DEFAULT_ENCODING);
    for (const [index, char] of content.entries()) {
      if (char > 127) {
        // if extended ascii
        switch (char) {
          case 192:
          case 193:
          case 194:
          case 195:
          case 196:
          case 197: // ÀÁÂÃÄÅ
            content[index] = 65; // replace with A
            break;
          case 199: // Ç
            content[index] = 67; // replace with C
            break;
          case 200:
          case 201:
          case 202:
          case 203: // ÈÉÊË
            content[index] = 69; // replace with E
            break;
          case 204:
          case 205:
          case 206:
          case 207: // ÌÍÎÏ
            content[index] = 73; // replace with I
            break;
          case 209: // Ñ
            content[index] = 78; // replace with N
            break;
          case 210:
          case 211:
          case 212:
          case 213:
          case 214: // ÒÓÔÕÖ
            content[index] = 79; // replace with O
            break;
          case 217:
          case 218:
          case 219:
          case 220: // ÙÚÛÜ
            content[index] = 85; // replace with U
            break;
          case 224:
          case 225:
          case 226:
          case 227:
          case 228:
          case 229: // àáâãäå
            content[index] = 97; // replace with a
            break;
          case 231: // ç
            content[index] = 99; // replace with c
            break;
          case 232:
          case 233:
          case 234:
          case 235: // èéêë
            content[index] = 101; // replace with e
            break;
          case 236:
          case 237:
          case 238:
          case 239: // ìíîï
            content[index] = 105; // replace with i
            break;
          case 241: // ñ
            content[index] = 110; // replace with n
            break;
          case 242:
          case 243:
          case 244:
          case 245:
          case 246: // óòôõö
            content[index] = 111; // replace with o
            break;
          case 249:
          case 250:
          case 251:
          case 252: // ùúûü
            content[index] = 117; // replace with u
            break;
          case 253:
          case 255: // ýÿ
            content[index] = 121; // replace with y
            break;
          default:
            content[index] = 63; // replace with ? by default
            break;
        }
      }
      // else keep the same character
    }
    return content;
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
   * Generates a new connected SFTP client ready to be used.
   * @returns client
   */
  public async getClient(): Promise<Client> {
    return this.sshService.createClient(this.sftpConfig);
  }

  @InjectLogger()
  logger: LoggerService;
}
