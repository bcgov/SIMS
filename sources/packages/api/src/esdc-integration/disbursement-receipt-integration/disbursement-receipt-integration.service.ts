import { Injectable } from "@nestjs/common";
import { ConfigService } from "../../services";
import { SshService } from "../../services/ssh/ssh.service";
import { SFTPIntegrationBase } from "../../services/ssh/sftp-integration-base";
import {
  DailyDisbursementUploadResult,
  DisbursementReceiptDownloadResponse,
  DisbursementReceiptRecordType,
} from "./models/disbursement-receipt-integration.model";
import { DisbursementReceiptHeader } from "./disbursement-receipt-files/disbursement-receipt-file-header";
import { DisbursementReceiptFooter } from "./disbursement-receipt-files/disbursement-receipt-file-footer";
import { DisbursementReceiptDetail } from "./disbursement-receipt-files/disbursement-receipt-file-detail";
import { getFileNameAsCurrentTimestamp } from "../../utilities";
import { ESDCIntegrationConfig } from "../../types";

@Injectable()
export class DisbursementReceiptIntegrationService extends SFTPIntegrationBase<DisbursementReceiptDownloadResponse> {
  private readonly esdcConfig: ESDCIntegrationConfig;
  constructor(config: ConfigService, sshService: SshService) {
    super(config.getConfig().zoneBSFTP, sshService);
    this.esdcConfig = config.getConfig().ESDCIntegration;
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
      const record = new DisbursementReceiptDetail(line, index + 1);
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
   * Converts the daily disbursements records to the final content and upload it.
   * @param dailyDisbursementsRecordsInCSV in string format.
   * @param remoteFilePath Remote location to upload the file (path + file name).
   * @returns Upload result.
   */
  async uploadDailyDisbursementContent(
    dailyDisbursementsRecordsInCSV: string,
    remoteFilePath: string,
  ): Promise<DailyDisbursementUploadResult> {
    // Send the file to ftp.
    this.logger.log("Creating new SFTP client to start upload...");
    const client = await this.getClient();
    try {
      this.logger.log(`Uploading ${remoteFilePath}`);
      await client.put(
        Buffer.from(dailyDisbursementsRecordsInCSV),
        remoteFilePath,
      );
      return {
        generatedFile: remoteFilePath,
        uploadedRecords: 1,
      };
    } finally {
      this.logger.log("Finalizing SFTP client...");
      await SshService.closeQuietly(client);
      this.logger.log("SFTP client finalized.");
    }
  }

  /**
   * Expected file name of the daily disbursements records file.
   * @returns Full file path of the file to be saved on the SFTP.
   */
  createRequestFileName(reportName: string): {
    fileName: string;
    filePath: string;
  } {
    const timestamp = getFileNameAsCurrentTimestamp();
    const fileName = `${reportName}_${timestamp}.csv`;
    const filePath = `${this.esdcConfig.ftpRequestFolder}\\${fileName}`;
    return {
      fileName,
      filePath,
    };
  }
}
