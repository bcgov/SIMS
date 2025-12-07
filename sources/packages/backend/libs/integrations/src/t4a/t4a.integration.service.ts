import { SFTPIntegrationBase, SshService } from "@sims/integrations/services";
import { ConfigService } from "@sims/utilities/config";
import { Injectable } from "@nestjs/common";
import { LoggerService } from "@sims/utilities/logger";
import { T4AUploadRecord } from "./models/t4a.models";

@Injectable()
export class T4AIntegrationService extends SFTPIntegrationBase<T4AUploadRecord> {
  constructor(
    config: ConfigService,
    sshService: SshService,
    logger: LoggerService,
    //private readonly objectStorageService: ObjectStorageService,
  ) {
    super(config.zoneBSFTP, sshService, logger);
  }

  transferFileToStudentAccount(
    remoteFilePath: string,
  ): Promise<T4AUploadRecord> {
    // this.objectStorageService.putObject({
    //   key: `${Date.now()}-${remoteFilePath.split("/").pop()}`,
    //   body: Readable.from(destination as unknown as string),
    //   contentType: "text/plain",
    // });
    throw new Error(`Method not implemented, ${remoteFilePath} not used.`);
  }
}
