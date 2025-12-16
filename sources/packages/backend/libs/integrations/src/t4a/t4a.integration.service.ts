import { SFTPIntegrationBase, SshService } from "@sims/integrations/services";
import { ConfigService } from "@sims/utilities/config";
import { Injectable } from "@nestjs/common";
import { LoggerService } from "@sims/utilities/logger";
import { T4AFileInfo } from "./models/t4a.models";
import { basename, dirname, extname, join } from "node:path";
import * as Client from "ssh2-sftp-client";

@Injectable()
export class T4AIntegrationService extends SFTPIntegrationBase<Buffer> {
  constructor(
    config: ConfigService,
    sshService: SshService,
    logger: LoggerService,
    private readonly configService: ConfigService,
  ) {
    super(config.zoneBSFTP, sshService, logger);
  }

  /**
   * Download the file content from the SFTP.
   * @param remoteFilePath Full remote file path.
   * @param options Method options.
   * - `client`: SFTP client to be used in the operation when the same
   * client is used for multiple operations.
   * @returns The downloaded raw file content.
   */
  async downloadResponseFile(
    remoteFilePath: string,
    options?: { client: Client },
  ): Promise<Buffer> {
    if (!options?.client) {
      throw new Error("SFTP client must be provided to download T4A files.");
    }
    const file = await options?.client.get(remoteFilePath);
    return file as Buffer;
  }

  /**
   * Gets the T4A file information to process the download from the SFTP.
   * @param relativeFilePath The relative file path on the SFTP T4A folder.
   * @param sftpClient The SFTP client to use for the operation.
   * @returns The T4A file information including content and metadata.
   */
  getT4FileInfo(relativeFilePath: string): T4AFileInfo {
    const directory = basename(dirname(relativeFilePath));
    const fileExtension = extname(relativeFilePath);
    const remoteFileFullPath = join(
      this.configService.t4aIntegration.folder,
      relativeFilePath,
    );
    const sin = basename(relativeFilePath, fileExtension);
    return {
      directory,
      remoteFileFullPath,
      fileExtension,
      sin,
    };
  }

  /**
   * Archives a file on SFTP.
   * @param remoteFilePath full remote file path with file name.
   * @param options Method options.
   * - `client`: SFTP client to be used in the operation when the same
   * client is used for multiple operations.
   */
  async archiveFile(
    remoteFilePath: string,
    options?: { client?: Client },
  ): Promise<void> {
    await super.archiveFile(remoteFilePath, {
      client: options?.client,
      absoluteArchiveDirectory: this.configService.t4aIntegration.archiveFolder,
    });
  }
}
