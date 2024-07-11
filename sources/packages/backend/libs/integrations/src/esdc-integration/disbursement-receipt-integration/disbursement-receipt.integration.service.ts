import { Injectable } from "@nestjs/common";
import { ConfigService, ESDCIntegrationConfig } from "@sims/utilities/config";
import {
  DisbursementReceiptDownloadResponse,
  DisbursementReceiptRecordType,
} from "./models/disbursement-receipt-integration.model";
import { DisbursementReceiptHeader } from "./disbursement-receipt-files/disbursement-receipt-file-header";
import { DisbursementReceiptFooter } from "./disbursement-receipt-files/disbursement-receipt-file-footer";
import { DisbursementReceiptDetail } from "./disbursement-receipt-files/disbursement-receipt-file-detail";
import { getISODateOnlyString } from "@sims/utilities";
import { SFTPIntegrationBase, SshService } from "@sims/integrations/services";

@Injectable()
export class DisbursementReceiptIntegrationService extends SFTPIntegrationBase<DisbursementReceiptDownloadResponse> {
  private readonly esdcConfig: ESDCIntegrationConfig;
  constructor(config: ConfigService, sshService: SshService) {
    super(config.zoneBSFTP, sshService);
    this.esdcConfig = config.esdcIntegration;
  }

  /**
   * Downloads the file specified on 'remoteFilePath' parameter from the
   * ESDC integration folder on the SFTP.
   * @param remoteFilePath full remote file path with file name.
   * @returns parsed records from the file.
   */
  async downloadResponseFile(
    remoteFilePath: string,
  ): Promise<DisbursementReceiptDownloadResponse> {
    const fileLines = await this.downloadResponseFileLines(remoteFilePath);
    // Read the first line to check if the header code is the expected one.
    const header = new DisbursementReceiptHeader(fileLines.shift()); // Read and remove header.
    if (header.recordType !== DisbursementReceiptRecordType.Header) {
      this.logger.error(
        `The Disbursement receipt file ${remoteFilePath} has an invalid transaction code on header: ${header.recordType}`,
      );
      // If the header is not the expected one, throw an error.
      throw new Error("Invalid file header.");
    }
    //Read the last line to check if the footer record type is the expected one and fetch the SIN Hash total.
    const footer = new DisbursementReceiptFooter(fileLines.pop());
    if (footer.recordType !== DisbursementReceiptRecordType.Footer) {
      this.logger.error(
        `The Disbursement receipt file ${remoteFilePath} has an invalid transaction code on footer: ${footer.recordType}`,
      );
      // If the footer is not the expected one.
      throw new Error("Invalid file footer.");
    }
    let totalSINHashCalculated = 0;
    const records: DisbursementReceiptDetail[] = [];
    fileLines.forEach((line, index) => {
      const record = new DisbursementReceiptDetail(line, index + 2); // Take into account the removed header line.
      totalSINHashCalculated += +record.studentSIN;
      records.push(record);
    });
    if (totalSINHashCalculated !== footer.sinHashTotal) {
      this.logger.error(
        `The Disbursement receipt file ${remoteFilePath} has SIN Hash total that is inconsistent with total sum of SIN in the records.`,
      );
      throw new Error("SIN Hash validation failed.");
    }
    return { header, records };
  }

  /**
   * Create file name for the daily disbursements report file.
   * @param reportName Report name to be a part of filename.
   * @returns Full file path of the file to be sent via emails.
   */
  createDisbursementFileName(reportName: string): string {
    const timestamp = getISODateOnlyString(new Date());
    const fileName = `${reportName}_${timestamp}.csv`;
    return fileName;
  }
}
