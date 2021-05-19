import { Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "..";
import { SshService } from "../ssh/ssh.service";
import * as Client from "ssh2-sftp-client";
import {
  CraRecord,
  TransactionCodes,
  TransactionSubCodes,
} from "./cra-integration.models";
import { CRAIntegrationConfig, SFTPConfig } from "../../types";
import { CraFileHeader } from "./file/cra-file-header";
import { CraFileFooter } from "./file/cra-file-footer";
import { CraFileLine } from "./file/cra-file";
import { CraFileRecord } from "./file/cra-file-record";

@Injectable({ scope: Scope.TRANSIENT })
export class CraIntegrationService {
  private readonly craConfig: CRAIntegrationConfig;
  private readonly ftpConfig: SFTPConfig;

  constructor(config: ConfigService, private readonly sshService: SshService) {
    this.craConfig = config.getConfig().CRAIntegration;
    this.ftpConfig = config.getConfig().zoneB_SFTP;
  }

  public createMatchingRunContent(records: CraRecord[]): CraFileLine[] {
    const sequenceNumber = 1;
    const processDate = new Date();
    const craFileLines: CraFileLine[] = [];

    // Header
    const fileHeader = this.createHeader(
      TransactionCodes.MatchingRunHeader,
      processDate,
      sequenceNumber,
    );
    craFileLines.push(fileHeader);
    // Records
    const fileRecords = records.map((r) => {
      const record = new CraFileRecord();
      record.transactionCode = TransactionCodes.MatchingRunRecord;
      record.sin = r.sin;
      record.transactionSubCode = TransactionSubCodes.IVRequest;
      record.individualSurname = r.individualSurname;
      record.individualGivenName = r.individualGivenName;
      record.individualBirthDate = r.individualBirthDate;
      record.programAreaCode = this.craConfig.programAreaCode;
      return record;
    });
    craFileLines.push(...fileRecords);
    // Footer
    const fileFooter = this.createFooter(
      TransactionCodes.MatchingRunFooter,
      processDate,
      sequenceNumber,
      records.length,
    );
    craFileLines.push(fileFooter);

    return craFileLines;
  }

  public async uploadContent(
    craFileLines: CraFileLine[],
    remoteFilePath: string,
  ): Promise<void> {
    // Generate fixed formatted file.
    const fixedFormttedLines: string[] = craFileLines.map(
      (line: CraFileLine) => {
        return line.getFixedFormat();
      },
    );
    const craFileContent = fixedFormttedLines.join("\r\n");

    // Send the file to ftp.
    const client = await this.getClient();
    await client.put(Buffer.from(craFileContent), remoteFilePath);
  }

  private createHeader(
    code: TransactionCodes,
    processDate: Date,
    sequence: number,
  ): CraFileHeader {
    const header = new CraFileHeader();
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
  ): CraFileFooter {
    const footer = new CraFileFooter();
    footer.transactionCode = code;
    footer.processDate = processDate;
    footer.programAreaCode = this.craConfig.programAreaCode;
    footer.environmentCode = this.craConfig.environmentCode;
    footer.sequence = sequence;
    footer.recordCount = recordCount + 2; // Number of records + header + footer.
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
