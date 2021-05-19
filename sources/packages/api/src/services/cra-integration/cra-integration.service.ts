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

  public async createSinVerificationRequest(records: CraRecord[]) {
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
    const fileRecords = records.map((record) => {
      return {
        transactionCode: TransactionCodes.MatchingRunRecord,
        sin: record.sin,
        transactionSubCode: TransactionSubCodes.IVRequest,
        individualSurname: record.individualSurname,
        individualGivenName: record.individualGivenName,
        individualBirthDate: record.individualBirthDate,
        programAreaCode: this.craConfig.programAreaCode,
      } as CraFileRecord;
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

    // Generate fixed formatted file.
    const fixedFormttedLines = craFileLines.map((line) => {
      return line.getFixedFormat();
    });
    const craFileContent = fixedFormttedLines.join("\n");

    // Send the file to ftp.
    const client = await this.getClient();
    client.put(
      Buffer.from(craFileContent),
      this.createRequestFileName(sequenceNumber),
    );
  }

  private createHeader(
    code: TransactionCodes,
    processDate: Date,
    sequence: number,
  ): CraFileHeader {
    return {
      transactionCode: code,
      processDate: processDate,
      programAreaCode: this.craConfig.programAreaCode,
      environmentCode: this.craConfig.environmentCode,
      sequence: sequence,
    } as CraFileHeader;
  }

  private createFooter(
    code: TransactionCodes,
    processDate: Date,
    sequence: number,
    recordCount: number,
  ): CraFileHeader {
    return {
      transactionCode: code,
      processDate: processDate,
      programAreaCode: this.craConfig.programAreaCode,
      environmentCode: this.craConfig.environmentCode,
      sequence: sequence,
      recordCount: recordCount + 2, // Number of records + header + footer.
    } as CraFileFooter;
  }

  private createRequestFileName(sequence: number): string {
    const sequenceFile = sequence.toString().padStart(5, "0");
    return `${this.craConfig.ftpRequestFolder}\\CCRA_REQUEST_${this.craConfig.environmentCode}${sequenceFile}.DAT`;
  }

  private async getClient(): Promise<Client> {
    return this.sshService.createClient(this.ftpConfig);
  }
}
