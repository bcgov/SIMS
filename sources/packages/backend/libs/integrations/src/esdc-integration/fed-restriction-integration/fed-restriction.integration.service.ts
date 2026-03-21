import { Injectable } from "@nestjs/common";
import { SFTPIntegrationBase, SshService } from "@sims/integrations/services";
import { ConfigService } from "@sims/utilities/config";
import { FedRestrictionFileRecord } from "./fed-restriction-files/fed-restriction-file-record";
import { LoggerService } from "@sims/utilities/logger";

@Injectable()
export class FedRestrictionIntegrationService extends SFTPIntegrationBase<
  FedRestrictionFileRecord[]
> {
  constructor(
    config: ConfigService,
    sshService: SshService,
    logger: LoggerService,
  ) {
    super(config.zoneBSFTP, sshService, logger);
  }

  async streamResponseFileRecords(
    remoteFilePath: string,
    fileRecordProcessor: (line: FedRestrictionFileRecord) => Promise<void>,
  ): Promise<void> {
    let lineNumber = 0;
    return super.streamResponseFileLines(remoteFilePath, async (fileLine) => {
      return fileRecordProcessor(
        new FedRestrictionFileRecord(fileLine, lineNumber++),
      );
    });
  }
}
