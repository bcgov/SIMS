import { InjectLogger } from "../../common";
import { LoggerService } from "../../logger/logger.service";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "../../services";
import { SshService } from "../../services/ssh/ssh.service";
import { SFTPIntegrationBase } from "../../services/ssh/sftp-integration-base";
import { RestrictionsGrouping } from "./fed-restriction-integration.models";
import { FedRestrictionFileRecord } from "./fed-restriction-files/fed-restriction-file-record";
import { formatToDateOnlyIsoFormat } from "src/utilities";

@Injectable()
export class FedRestrictionIntegrationService extends SFTPIntegrationBase<RestrictionsGrouping> {
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
  ): Promise<RestrictionsGrouping> {
    const fileLines = await this.downloadResponseFileLines(remoteFilePath);
    const grouping = {} as RestrictionsGrouping;
    fileLines.forEach((line, index) => {
      const restriction = new FedRestrictionFileRecord(line, index + 1);
      const groupUniqueName = this.createUniqueRestrictionKey(
        restriction.surname,
        restriction.sin,
        restriction.dateOfBirth,
      );
      if (!grouping[groupUniqueName]) {
        grouping[groupUniqueName] = [];
      }
      grouping[groupUniqueName].push(restriction);
    });

    return grouping;
  }

  createUniqueRestrictionKey(lastName: string, sin: string, dateOfBirth: Date) {
    return `${lastName}_${sin}_${formatToDateOnlyIsoFormat(
      dateOfBirth,
    )}`.toLowerCase();
  }

  @InjectLogger()
  logger: LoggerService;
}
