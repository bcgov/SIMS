import { Injectable } from "@nestjs/common";
import { ConfigService } from "../../services";
import { SshService } from "../../services/ssh/ssh.service";
import { SFTPIntegrationBase } from "../../services/ssh/sftp-integration-base";
import {
  DisbursementReceiptDownloadResponse,
  DisbursementReceiptDetail,
  DisbursementReceiptHeader,
  DisbursementReceiptRecordType,
  DisbursementReceiptFooter,
} from "./models/disbursement-receipt-integration.model";

@Injectable()
export class DisbursementReceiptIntegrationService extends SFTPIntegrationBase<DisbursementReceiptDownloadResponse> {
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
  ): Promise<DisbursementReceiptDownloadResponse> {
    const fileLines: string[] = [];
    fileLines.push("BC22267890F027772022051620220512");
    fileLines.push(
      "BC22267890DDIS165760208FE10000309    027300{027300{20220512027300{000000{20220502AUAFE20220731022500{022500{022500{000000{FT    022500{      000000{      000000{      000000{      000000{      000000{      000000{      000000{      000000{      000000{                                                ",
    );
    fileLines.push(
      "BC22267890DDIS362701658FE10000306    000000{000000{20220512000000{000000{20220502AJBHE20220831124350{124350{124350{000000{FT    029420{TU    007850{PD    040000{FTDEP 047080{      000000{      000000{      000000{      000000{      000000{      000000{                                                ",
    );
    fileLines.push(
      "BC22267890TDIS000001600000080000168300{0000293540{00000080000115850{0000088450{000006381527834",
    );
    //const fileLines = await this.downloadResponseFileLines(remoteFilePath);
    // Read the first line to check if the header code is the expected one.
    const header = new DisbursementReceiptHeader(fileLines.shift()); // Read and remove header.
    if (header.recordType !== DisbursementReceiptRecordType.Header) {
      this.logger.error(
        `The Disbursement receipt file ${remoteFilePath} has an invalid transaction code on header: ${header.recordType}`,
      );
      // If the header is not the expected one, throw an error.
      throw new Error("Invalid file header.");
    }
    //Read the last line to check if the trailer record type is the expected one and fetch the SIN Hash total.
    const trailer = new DisbursementReceiptFooter(fileLines.pop());
    if (trailer.recordType !== DisbursementReceiptRecordType.Trailer) {
      this.logger.error(
        `The Disbursement receipt file ${remoteFilePath} has an invalid transaction code on trailer: ${trailer.recordType}`,
      );
      // If the trailer is not the expected one.
      throw new Error("Invalid file trailer.");
    }
    let totalSINHashCalculated = 0;
    const records: DisbursementReceiptDetail[] = [];
    fileLines.forEach((line, index) => {
      const record = new DisbursementReceiptDetail(line, index + 1);
      totalSINHashCalculated += parseInt(record.studentSIN);
      records.push(record);
    });
    if (totalSINHashCalculated !== trailer.sinHashTotal) {
      this.logger.error(
        `The Disbursement receipt file ${remoteFilePath} has SIN Hash total that is inconsistent with total sum of SIN in the records.`,
      );
      throw new Error("SIN Hash validation failed.");
    }
    return { header, records };
  }
}
