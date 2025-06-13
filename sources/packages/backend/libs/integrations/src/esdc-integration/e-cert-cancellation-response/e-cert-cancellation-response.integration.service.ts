import { SFTPIntegrationBase, SshService } from "@sims/integrations/services";
import { ConfigService } from "@sims/utilities/config";
import { Injectable } from "@nestjs/common";
import {
  ECertCancellationDownloadResponse,
  ECertCancellationResponseRecordType,
} from "./models/e-cert-cancellation-response.model";
import { ECertCancellationResponseFileHeader } from "./e-cert-cancellation-response-files/e-cert-cancellation-response-file-header";
import { ECertCancellationResponseFileFooter } from "./e-cert-cancellation-response-files/e-cert-cancellation-response-file-footer";
import { ECertCancellationResponseFileDetail } from "./e-cert-cancellation-response-files/e-cert-cancellation-response-file-detail";
import { CustomNamedError } from "@sims/utilities";
import { FILE_PARSING_ERROR } from "@sims/services/constants";

@Injectable()
export class ECertCancellationResponseIntegrationService extends SFTPIntegrationBase<ECertCancellationDownloadResponse> {
  constructor(config: ConfigService, sshService: SshService) {
    super(config.zoneBSFTP, sshService);
  }

  /**
   * Download the e-cert cancellation response file from the path {@link remoteFilePath}.
   * @param remoteFilePath full remote file path with file name.
   * @returns parsed file records.
   */
  async downloadResponseFile(
    remoteFilePath: string,
  ): Promise<ECertCancellationDownloadResponse> {
    const fileLines = await this.downloadResponseFileLines(remoteFilePath);
    // Read the first line which is the header. After reading it, it will be removed.
    const header = new ECertCancellationResponseFileHeader(fileLines.shift());
    // Validate the header record type.
    if (header.recordType !== ECertCancellationResponseRecordType.Header) {
      throw new CustomNamedError(
        `The e-cert cancellation response file ${remoteFilePath} has an invalid record type on header ${header.recordType}.`,
        FILE_PARSING_ERROR,
      );
    }
    // Read the last line which is the footer. After reading it, it will be removed.
    const footer = new ECertCancellationResponseFileFooter(fileLines.pop());
    if (footer.recordType !== ECertCancellationResponseRecordType.Footer) {
      throw new CustomNamedError(
        `The e-cert cancellation response file ${remoteFilePath} has an invalid record type on footer ${footer.recordType}.`,
        FILE_PARSING_ERROR,
      );
    }
    // Validate if the number of detail records in the footer matches the total count of detail records in the file.
    if (footer.totalDetailRecords !== fileLines.length) {
      throw new CustomNamedError(
        `The total number of detail records ${footer.totalDetailRecords} in the footer does not match the total count of detail records ${fileLines.length} in the e-cert cancellation response file ${remoteFilePath}.`,
        FILE_PARSING_ERROR,
      );
    }
    // Parse the detail records from the remaining lines in the file.
    // The first line is the header, so we start from index 2.
    const detailRecords = fileLines.map(
      (line, index) => new ECertCancellationResponseFileDetail(line, index + 2),
    );
    return { detailRecords };
  }
}
