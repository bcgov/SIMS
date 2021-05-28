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
} from "./cra-integration.models";
import { CRAIntegrationConfig, SFTPConfig } from "../types";
import { CRAFileHeader } from "./cra-files/cra-file-header";
import { CRAFileFooter } from "./cra-files/cra-file-footer";
import { CRARequestFileLine } from "./cra-files/cra-file";
import { CRAFileIVRequestRecord } from "./cra-files/cra-file-request-record";
import { CRARecordIdentification } from "./cra-files/cra-file-response-record-id";
import { CRAResponseFileLine } from "./cra-files/cra-file-response-record";
import { CRAResponseFile } from "./cra-files/cra-file-response";

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
   * @param records Personal/individual records to be processed.
   * @param sequence File request sequence number that is required
   * by CRA server processing.
   * @returns Matching run content.
   */
  public createMatchingRunContent(
    records: CRAPersonRecord[],
    sequence: number,
  ): CRARequestFileLine[] {
    const processDate = new Date();
    const craFileLines: CRARequestFileLine[] = [];

    // Header
    const fileHeader = this.createHeader(
      TransactionCodes.MatchingRunHeader,
      processDate,
      sequence,
    );
    craFileLines.push(fileHeader);
    // Records
    const fileRecords = records.map((record) => {
      const craRecord = new CRAFileIVRequestRecord();
      craRecord.transactionCode = TransactionCodes.MatchingRunRecord;
      craRecord.sin = record.sin;
      craRecord.individualSurname = record.surname;
      craRecord.individualGivenName = record.givenName;
      craRecord.individualBirthDate = record.birthDate;
      craRecord.programAreaCode = this.craConfig.programAreaCode;
      return craRecord;
    });
    craFileLines.push(...fileRecords);
    // Footer
    const fileFooter = this.createFooter(
      TransactionCodes.MatchingRunFooter,
      processDate,
      sequence,
      records.length,
    );
    craFileLines.push(fileFooter);

    return craFileLines;
  }

  /**
   * Converts the craFileLines to the final content and upload it.
   * @param craFileLines Array of lines to be converted to a formatted fixed size file.
   * @param remoteFilePath Remote location to upload the file (path + file name).
   * @returns Upload result.
   */
  public async uploadContent(
    craFileLines: CRARequestFileLine[],
    remoteFilePath: string,
  ): Promise<CRAUploadResult> {
    // Generate fixed formatted file.
    const fixedFormttedLines: string[] = craFileLines.map(
      (line: CRARequestFileLine) => line.getFixedFormat(),
    );
    const craFileContent = fixedFormttedLines.join("\r\n");

    // Send the file to ftp.
    const client = await this.getClient();
    try {
      await client.put(Buffer.from(craFileContent), remoteFilePath);
      return {
        generatedFile: remoteFilePath,
        uploadedRecords: craFileLines.length,
      };
    } finally {
      await SshService.closeQuietly(client);
    }
  }

  private createHeader(
    code: TransactionCodes,
    processDate: Date,
    sequence: number,
  ): CRAFileHeader {
    const header = new CRAFileHeader();
    header.transactionCode = code;
    header.processDate = processDate;
    header.programAreaCode = this.craConfig.programAreaCode;
    header.environmentCode = this.craConfig.environmentCode;
    header.sequence = sequence;
    return header;
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

  public createRequestFileName(sequence: number): string {
    const sequenceFile = sequence.toString().padStart(5, "0");
    return `${this.craConfig.ftpRequestFolder}\\CCRA_REQUEST_${this.craConfig.environmentCode}${sequenceFile}.DAT`;
  }

  public async downloadResponseFiles(): Promise<CRAResponseFile[]> {
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

    const processes = filesToProcess.map((file) =>
      this.downloadResponseFile(file.name),
    );
    const allFiles = await Promise.all(processes);
    return ([] as CRAResponseFile[]).concat(...allFiles);
  }

  private async downloadResponseFile(
    fileName: string,
  ): Promise<CRAResponseFile> {
    const client = await this.getClient();
    try {
      // Read all the files content and create a buffer.
      const filePath = `${this.craConfig.ftpResponseFolder}/${fileName}`;
      const fileContent = await client.get(filePath);
      // Convert the file content to an array of string lines.
      const fileLines = fileContent.toString().split("\r\n");
      // Read the first line to check if the header code is the expected one.
      const header = CRAFileHeader.CreateFromLine(fileLines.shift()); // Read and remove header.
      if (header.transactionCode !== TransactionCodes.ResponseHeader) {
        this.logger.error(
          `The CRA file ${fileName} has an invalid transaction code on header: ${header.transactionCode}`,
        );
        // If the header is not the expcted one, just ignore the file.
        return null;
      }

      // Remove footer (not used).
      fileLines.pop();

      // Generate the records.
      const records = fileLines.map((line) => {
        var craRecord = new CRARecordIdentification(line);
        switch (craRecord.transactionSubCode) {
          case TransactionSubCodes.ResponseRecord:
            return new CRAResponseFileLine(line);
          case TransactionSubCodes.IVRequest:
            // TODO: Change this to the specific 'Income Request Record (0020)'.
            return craRecord;
          default:
            return craRecord;
        }
      });

      return {
        filePath,
        records,
      };
    } finally {
      await SshService.closeQuietly(client);
    }
  }

  private async getClient(): Promise<Client> {
    return this.sshService.createClient(this.ftpConfig);
  }

  @InjectLogger()
  logger: LoggerService;
}
