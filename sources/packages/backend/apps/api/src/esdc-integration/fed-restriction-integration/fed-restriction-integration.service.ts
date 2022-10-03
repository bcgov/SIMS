import { Injectable } from "@nestjs/common";
import { ConfigService } from "../../services";
import { SshService } from "../../services/ssh/ssh.service";
import { SFTPIntegrationBase } from "../../services/ssh/sftp-integration-base";
import { FedRestrictionFileRecord } from "./fed-restriction-files/fed-restriction-file-record";

@Injectable()
export class FedRestrictionIntegrationService extends SFTPIntegrationBase<
  FedRestrictionFileRecord[]
> {
  constructor(config: ConfigService, sshService: SshService) {
    super(config.getConfig().zoneBSFTP, sshService);
  }

  /**
   * Downloads the file specified on 'remoteFilePath' parameter from the
   * ESDC integration folder on the SFTP.
   * @param remoteFilePath full remote file path with file name.
   * @returns parsed records from the file.
   */
  async downloadResponseFile(
    remoteFilePath: string,
  ): Promise<FedRestrictionFileRecord[]> {
    const fileLines = await this.downloadResponseFileLines(remoteFilePath);
    return fileLines.map((line, index) => {
      return new FedRestrictionFileRecord(line, index + 1);
    });
  }
}
