import { InjectLogger } from "../common";
import { LoggerService } from "../logger/logger.service";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "../services";
import { SshService } from "../services/ssh/ssh.service";
import * as Client from "ssh2-sftp-client";
import {
  CRAPersonRecord,
  CRAUploadResult,
  TransactionCodes,
  TransactionSubCodes,
  CRAsFtpResponseFile,
} from "./cra-integration.models";
import { CRAIntegrationConfig, SFTPConfig } from "../types";
import { CRAFileHeader } from "./cra-files/cra-file-header";
import { CRAFileFooter } from "./cra-files/cra-file-footer";
import { CRARequestFileLine } from "./cra-files/cra-request-file-line";
import { CRAFileIVRequestRecord } from "./cra-files/cra-file-iv-request-record";
import { CRAResponseRecordIdentification } from "./cra-files/cra-response-record-identification";
import { CRAResponseStatusRecord } from "./cra-files/cra-response-status-record";
import { CRAResponseTotalIncomeRecord } from "./cra-files/cra-response-total-income-record";

/**
 * Manages the creation of the content files that needs to be sent
 * to Canada Revenue Agency (CRA). These files are created based
 * on a fixed size format and uploaded to a SFTP on Government
 * ZONE B network for further processing and final send to CRA servers.
 */
@Injectable()
export class CRAIntegrationService {
  private readonly craConfig: CRAIntegrationConfig;
  private readonly ftpConfig: SFTPConfig;

  constructor(config: ConfigService, private readonly sshService: SshService) {
    this.craConfig = config.getConfig().CRAIntegration;
    this.ftpConfig = config.getConfig().zoneBsFTP;
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
  ): CRARequestFileLine[] {
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
  ): CRARequestFileLine[] {
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
  ): CRARequestFileLine[] {
    const processDate = new Date();
    const craFileLines: CRARequestFileLine[] = [];
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
   * Converts the craFileLines to the final content and upload it.
   * @param craFileLines Array of lines to be converted to a formatted fixed size file.
   * @param remoteFilePath Remote location to upload the file (path + file name).
   * @returns Upload result.
   */
  async uploadContent(
    craFileLines: CRARequestFileLine[],
    remoteFilePath: string,
  ): Promise<CRAUploadResult> {
    // Generate fixed formatted file.
    const fixedFormattedLines: string[] = craFileLines.map(
      (line: CRARequestFileLine) => line.getFixedFormat(),
    );
    const craFileContent = fixedFormattedLines.join("\r\n");

    // Send the file to ftp.
    this.logger.log("Creating new sFTP client to start upload...");
    const client = await this.getClient();
    try {
      this.logger.log(`Uploading ${remoteFilePath}`);
      await client.put(Buffer.from(craFileContent), remoteFilePath);
      return {
        generatedFile: remoteFilePath,
        uploadedRecords: craFileLines.length - 2, // Do not consider header/footer.
      };
    } finally {
      this.logger.log("Finalizing sFTP client...");
      await SshService.closeQuietly(client);
      this.logger.log("sFTP client finalized.");
    }
  }

  private createFooter(
    code: TransactionCodes,
    processDate: Date,
    sequence: number,
    recordCount: number,
  ): CRAFileFooter {
    const footer = new CRAFileFooter();
    footer.transactionCode = code;
    footer.processDate = processDate;
    footer.programAreaCode = this.craConfig.programAreaCode;
    footer.environmentCode = this.craConfig.environmentCode;
    footer.sequence = sequence;
    footer.recordCount = recordCount + 2; // Must be the number of records + header + footer.
    return footer;
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
   * Get the list of all response files waiting to be downloaded from the
   * sFTP filtering by the the regex pattern '/CCRA_RESPONSE_[\w]*\.txt/i'.
   * @returns file names for all response files present on sFTP.
   */
  async getResponseFilesNames(): Promise<string[]> {
    let filesToProcess: Client.FileInfo[];
    const client = await this.getClient();
    try {
      filesToProcess = await client.list(
        `${this.craConfig.ftpResponseFolder}`,
        /CCRA_RESPONSE_[\w]*\.txt/i,
      );
    } finally {
      await SshService.closeQuietly(client);
    }

    return filesToProcess.map((file) => file.name);
  }

  /**
   * Downloads the file specified on 'fileName' parameter from the
   * CRA response folder on the sFTP.
   * @param fileName File to be downloaded.
   * @returns Parsed records from the file.
   */
  async downloadResponseFile(fileName: string): Promise<CRAsFtpResponseFile> {
    const client = await this.getClient();
    try {
      const filePath = `${this.craConfig.ftpResponseFolder}/${fileName}`;
      // Read all the file content and create a buffer.
      const fileContent = await client.get(filePath);
      // Convert the file content to an array of text lines and remove possible blank lines.
      const fileLines = fileContent
        .toString()
        .split(/\r\n|\n\r|\n|\r/)
        .filter((line) => line.length > 0);
      // Read the first line to check if the header code is the expected one.
      const header = CRAFileHeader.CreateFromLine(fileLines.shift()); // Read and remove header.
      if (header.transactionCode !== TransactionCodes.ResponseHeader) {
        this.logger.error(
          `The CRA file ${fileName} has an invalid transaction code on header: ${header.transactionCode}`,
        );
        // If the header is not the expected one, just ignore the file.
        return null;
      }

      // Remove footer (not used).
      fileLines.pop();

      // Generate the records.
      let lineNumber = 1;
      const statusRecords: CRAResponseStatusRecord[] = [];
      const totalIncomeRecords: CRAResponseTotalIncomeRecord[] = [];
      for (const line of fileLines) {
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
        lineNumber++;
      }

      return {
        fileName,
        filePath,
        statusRecords,
        totalIncomeRecords,
      };
    } finally {
      await SshService.closeQuietly(client);
    }
  }

  /**
   * Delete a file from sFTP.
   * @param filePath Full path of the file to be deleted.
   */
  async deleteFile(filePath: string): Promise<void> {
    const client = await this.getClient();
    try {
      await client.delete(filePath);
    } finally {
      await SshService.closeQuietly(client);
    }
  }

  /**
   * Generates a new connected sFTP client ready to be used.
   * @returns client
   */
  private async getClient(): Promise<Client> {
    return this.sshService.createClient(this.ftpConfig);
  }

  @InjectLogger()
  logger: LoggerService;
}
