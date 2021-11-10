import { InjectLogger } from "../common";
import { LoggerService } from "../logger/logger.service";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "../services";
import { SshService } from "../services/ssh/ssh.service";
import {
  CRAPersonRecord,
  TransactionCodes,
  TransactionSubCodes,
  CRAsFtpResponseFile,
} from "./cra-integration.models";
import { CRAIntegrationConfig } from "../types";
import { CRAFileHeader } from "./cra-files/cra-file-header";
import { CRAFileFooter } from "./cra-files/cra-file-footer";
import { CRAFileIVRequestRecord } from "./cra-files/cra-file-iv-request-record";
import { CRAResponseRecordIdentification } from "./cra-files/cra-response-record-identification";
import { CRAResponseStatusRecord } from "./cra-files/cra-response-status-record";
import { CRAResponseTotalIncomeRecord } from "./cra-files/cra-response-total-income-record";
import { FixedFormatFileLine } from "../services/ssh/sftp-integration-base.models";
import { SFTPIntegrationBase } from "../services/ssh/sftp-integration-base";

/**
 * Manages the creation of the content files that needs to be sent
 * to Canada Revenue Agency (CRA). These files are created based
 * on a fixed size format and uploaded to a SFTP on Government
 * ZONE B network for further processing and final send to CRA servers.
 */
@Injectable()
export class CRAIntegrationService extends SFTPIntegrationBase<CRAsFtpResponseFile> {
  private readonly craConfig: CRAIntegrationConfig;

  constructor(config: ConfigService, sshService: SshService) {
    super(config.getConfig().zoneBSFTP, sshService);
    this.craConfig = config.getConfig().CRAIntegration;
  }

  /**
   * Creates a matching run request used, for instance, to validate
   * the SIN information.
   * @param records personal/individual records to be processed.
   * @param sequence file request sequence number that is required
   * by CRA server processing.
   * @returns Matching run content.
   */
  createMatchingRunContent(
    records: CRAPersonRecord[],
    sequence: number,
  ): FixedFormatFileLine[] {
    return this.createCRARequestFile(
      records,
      sequence,
      TransactionCodes.MatchingRunHeader,
      TransactionCodes.MatchingRunRecord,
      TransactionCodes.MatchingRunFooter,
    );
  }

  /**
   * Creates an income validation request.
   * @param records personal/individual records to be processed.
   * @param sequence file request sequence number that is required
   * by CRA server processing.
   * @returns Income validation request.
   */
  createIncomeValidationContent(
    records: CRAPersonRecord[],
    sequence: number,
  ): FixedFormatFileLine[] {
    return this.createCRARequestFile(
      records,
      sequence,
      TransactionCodes.IncomeRequestHeader,
      TransactionCodes.IncomeRequestRecord,
      TransactionCodes.IncomeRequestFooter,
    );
  }

  /**
   * Creates the CRA file with header, records and footer
   * as expected to be later converted to a text file.
   * @param records records that represents each person (student).
   * @param sequence sequence number present on header/footer.
   * @param headerTransactionCode header code.
   * @param recordTransactionCode record code.
   * @returns CRA request file.
   */
  private createCRARequestFile(
    records: CRAPersonRecord[],
    sequence: number,
    headerTransactionCode: TransactionCodes,
    recordTransactionCode: TransactionCodes,
    footerTransactionCode: TransactionCodes,
  ): FixedFormatFileLine[] {
    const processDate = new Date();
    const craFileLines: FixedFormatFileLine[] = [];
    // Header
    const header = new CRAFileHeader();
    header.transactionCode = headerTransactionCode;
    header.processDate = processDate;
    header.programAreaCode = this.craConfig.programAreaCode;
    header.environmentCode = this.craConfig.environmentCode;
    header.sequence = sequence;
    craFileLines.push(header);
    // Records
    const fileRecords = records.map((record) => {
      const craRecord = new CRAFileIVRequestRecord();
      craRecord.transactionCode = recordTransactionCode;
      craRecord.sin = record.sin;
      craRecord.individualSurname = record.surname;
      craRecord.individualGivenName = record.givenName;
      craRecord.individualBirthDate = record.birthDate;
      craRecord.programAreaCode = this.craConfig.programAreaCode;
      craRecord.taxYear = record.taxYear;
      craRecord.freeProjectArea = record.freeProjectArea;
      return craRecord;
    });
    craFileLines.push(...fileRecords);
    // Footer
    const footer = new CRAFileFooter();
    footer.transactionCode = footerTransactionCode;
    footer.processDate = processDate;
    footer.programAreaCode = this.craConfig.programAreaCode;
    footer.environmentCode = this.craConfig.environmentCode;
    footer.sequence = sequence;
    footer.recordCount = records.length + 2; // Must be the number of records + header + footer.
    craFileLines.push(footer);

    return craFileLines;
  }

  /**
   * Expected file name of the CRA request file.
   * @param sequence file sequence number.
   * @returns Full file path of the file to be saved on the SFTP.
   */
  createRequestFileName(sequence: number): {
    fileName: string;
    filePath: string;
  } {
    const sequenceFile = sequence.toString().padStart(5, "0");
    const fileName = `CCRA_REQUEST_${this.craConfig.environmentCode}${sequenceFile}.DAT`;
    const filePath = `${this.craConfig.ftpRequestFolder}\\${fileName}`;
    return {
      fileName,
      filePath,
    };
  }

  /**
   * Downloads the file specified on 'remoteFilePath' parameter from the
   * CRA response folder on the SFTP.
   * @param remoteFilePath full remote file path with file name.
   * @returns Parsed records from the file.
   */
  async downloadResponseFile(
    remoteFilePath: string,
  ): Promise<CRAsFtpResponseFile> {
    const fileLines = await this.downloadResponseFileLines(remoteFilePath);
    // Read the first line to check if the header code is the expected one.
    const header = CRAFileHeader.CreateFromLine(fileLines.shift()); // Read and remove header.
    if (header.transactionCode !== TransactionCodes.ResponseHeader) {
      this.logger.error(
        `The CRA file ${remoteFilePath} has an invalid transaction code on header: ${header.transactionCode}`,
      );
      // If the header is not the expected one, throw an error.
      throw new Error("Invalid file header.");
    }

    // Remove footer (not used).
    fileLines.pop();

    // Generate the records.
    const statusRecords: CRAResponseStatusRecord[] = [];
    const totalIncomeRecords: CRAResponseTotalIncomeRecord[] = [];
    fileLines.forEach((line: string, index: number) => {
      const lineNumber = index + 1;
      const craRecord = new CRAResponseRecordIdentification(line, lineNumber);
      switch (craRecord.transactionSubCode) {
        case TransactionSubCodes.ResponseStatusRecord:
          statusRecords.push(new CRAResponseStatusRecord(line, lineNumber));
          break;
        case TransactionSubCodes.TotalIncome:
          totalIncomeRecords.push(
            new CRAResponseTotalIncomeRecord(line, lineNumber),
          );
          break;
      }
    });

    return {
      statusRecords,
      totalIncomeRecords,
    };
  }

  @InjectLogger()
  logger: LoggerService;
}
