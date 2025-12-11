import { SFTPIntegrationBase, SshService } from "@sims/integrations/services";
import { ConfigService } from "@sims/utilities/config";
import { Injectable } from "@nestjs/common";
import { LoggerService } from "@sims/utilities/logger";
import { T4AFileInfo } from "./models/t4a.models";
import { basename, dirname, extname } from "node:path";
import { T4A_SFTP_IN_FOLDER } from "@sims/integrations/constants";
import * as Client from "ssh2-sftp-client";

@Injectable()
export class T4AIntegrationService extends SFTPIntegrationBase<Buffer> {
  constructor(
    config: ConfigService,
    sshService: SshService,
    logger: LoggerService,
  ) {
    super(config.zoneBSFTP, sshService, logger);
  }

  /**
   * When overridden in a derived class, transform the text lines
   * in parsed objects specific to the integration process.
   * @param remoteFilePath full remote file path with file name.
   * @param options Optional parameters including SFTP client.
   * - `client`: SFTP client to be used in the operation when the same
   * client is used for multiple operations.
   * @returns The parsed download object.
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
    const remoteFileFullPath = `${T4A_SFTP_IN_FOLDER}/${relativeFilePath}`;
    const sin = basename(relativeFilePath, fileExtension);
    return {
      directory,
      remoteFileFullPath,
      fileExtension,
      sin,
    };
  }
}
