import { Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "../services";
import { SshService } from "../services/ssh/ssh.service";
import * as Client from "ssh2-sftp-client";
import {
  CRAPersonRecord,
  CRAUploadResult,
  TransactionCodes,
} from "./cra-integration.models";
import { CRAIntegrationConfig, SFTPConfig } from "../types";
import { CRAFileHeader } from "./cra-files/cra-file-header";
import { CRAFileFooter } from "./cra-files/cra-file-footer";
import { CRAFileLine } from "./cra-files/cra-file";
import { CRAFileIVRequestRecord } from "./cra-files/cra-file-request-record";

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
    this.ftpConfig = config.getConfig().zoneB_SFTP;
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
  ): CRAFileLine[] {
    const processDate = new Date();
    const craFileLines: CRAFileLine[] = [];

    // Header
    const fileHeader = this.createHeader(
      TransactionCodes.MatchingRunHeader,
      processDate,
      sequence,
    );
    craFileLines.push(fileHeader);
    // Records
    const fileRecords = records.map((r) => {
      const record = new CRAFileIVRequestRecord();
      record.transactionCode = TransactionCodes.MatchingRunRecord;
      record.sin = r.sin;
      record.individualSurname = r.surname;
      record.individualGivenName = r.givenName;
      record.individualBirthDate = r.birthDate;
      record.programAreaCode = this.craConfig.programAreaCode;
      return record;
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
    craFileLines: CRAFileLine[],
    remoteFilePath: string,
  ): Promise<CRAUploadResult> {
    // Generate fixed formatted file.
    const fixedFormttedLines: string[] = craFileLines.map((line: CRAFileLine) =>
      line.getFixedFormat(),
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

  private async getClient(): Promise<Client> {
    return this.sshService.createClient(this.ftpConfig);
  }
}
