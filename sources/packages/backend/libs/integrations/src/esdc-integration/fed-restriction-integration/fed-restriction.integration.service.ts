import { Injectable } from "@nestjs/common";
import { SFTPIntegrationBase, SshService } from "@sims/integrations/services";
import { ConfigService } from "@sims/utilities/config";
import { FedRestrictionFileRecord } from "./fed-restriction-files/fed-restriction-file-record";

@Injectable()
export class FedRestrictionIntegrationService extends SFTPIntegrationBase<
  FedRestrictionFileRecord[]
> {
  constructor(config: ConfigService, sshService: SshService) {
    super(config.zoneBSFTP, sshService);
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
    const fileLines = await this.downloadResponseFileLines(remoteFilePath, {
      checkIfZipFile: true,
    });
    return fileLines.map((line, index) => {
      return new FedRestrictionFileRecord(line, index + 1);
    });
  }
}
