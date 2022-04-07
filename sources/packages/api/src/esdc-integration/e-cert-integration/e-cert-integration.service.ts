import { Injectable } from "@nestjs/common";
import { FixedFormatFileLine } from "src/services/ssh/sftp-integration-base.models";
import { SFTPIntegrationBase } from "../../services/ssh/sftp-integration-base";
import { ECertRecord } from "./e-cert-integration-model";

@Injectable()
export abstract class ECertIntegrationService<
  DownloadType,
> extends SFTPIntegrationBase<DownloadType> {
  /**
   * This method will be implemented in the extended class and is used to create the ECert request content.
   * @param ecertRecords
   * @param fileSequence
   */
  createRequestContent(
    ecertRecords: ECertRecord[],
    fileSequence: number,
  ): FixedFormatFileLine[] {
    throw new Error(
      `Method not implemented , ${ecertRecords} && ${fileSequence} not declared`,
    );
  }
  /**
   * This method will be implemented in the extended class and is used to for response processing of ECert file.
   * @param remoteFilePath
   */
  downloadResponseFile(remoteFilePath: string): Promise<DownloadType> {
    throw new Error(`Method not implemented , ${remoteFilePath} not declared`);
  }
}
