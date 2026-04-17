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

  /**
   * Streams the response file records line by line, allowing processing of each record without loading the entire file into memory.
   * This is especially useful for large files that can cause memory issues when loaded entirely.
   * @param remoteFilePath full remote file path with file name.
   * @param fileRecordProcessor callback function to process each record of the file.
   * @returns promise that resolves when the file has been fully processed.
   */
  async streamResponseFileRecords(
    remoteFilePath: string,
    fileRecordProcessor: (
      line: FedRestrictionFileRecord,
      progress: number,
    ) => Promise<void>,
  ): Promise<void> {
    let lineNumber = 1;
    return this.streamResponseFileLines(
      remoteFilePath,
      async (fileLine, progress) => {
        return fileRecordProcessor(
          new FedRestrictionFileRecord(fileLine, lineNumber++),
          // Will be available since reportProgress is true.
          progress!,
        );
      },
      { reportProgress: true },
    );
  }
}
