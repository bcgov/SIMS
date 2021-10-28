import { Injectable } from "@nestjs/common";
import { ConfigService, SshService } from "src/services";
import { MSFAAIntegrationConfig, SFTPConfig } from "src/types";
import {
  MSFAARecord,
  MSFAARequestFileLine,
  TransactionCodes,
} from "./models/msfaa-integration.model";

/**
 * Manages the creation of the content files that needs to be sent
 * to MSFAA validation. These files are created based
 * on a fixed size format and uploaded to a SFTP on Government
 * ZONE B network for further processing and final send to servers.
 */
@Injectable()
export class MSFAAIntegrationService {
  private readonly msfaaConfig: MSFAAIntegrationConfig;
  private readonly ftpConfig: SFTPConfig;

  constructor(config: ConfigService, private readonly sshService: SshService) {
    this.msfaaConfig = config.getConfig().MSFAAIntegration;
    this.ftpConfig = config.getConfig().zoneBSFTP;
  }

  async createMSFAAValidationContent(
    msfaaRecords: MSFAARecord[],
    fileSequence: number,
  ): Promise<MSFAARequestFileLine[]> {
    const processDate = new Date();
    const craFileLines: MSFAARequestFileLine[] = [];
    // Header
    const header = new CRAFileHeader();
    header.transactionCode = TransactionCodes.MSFAARequestHeader;
    header.processDate = processDate;
    header.provinceCode = this.msfaaConfig.provinceCode;
    header.sequence = fileSequence;
    craFileLines.push(header);
    // Records
    const fileRecords = msfaaRecords.map((msfaaRecord) => {
      const craRecord = new CRAFileIVRequestRecord();
      craRecord.transactionCode = TransactionCodes.MSFAARequestDetail;
      craRecord.sin = msfaaRecord.sin;
      craRecord.individualSurname = msfaaRecord.surname;
      craRecord.individualGivenName = msfaaRecord.givenName;
      craRecord.individualBirthDate = msfaaRecord.birthDate;
      craRecord.taxYear = msfaaRecord.taxYear;
      craRecord.freeProjectArea = msfaaRecord.freeProjectArea;
      return craRecord;
    });
    craFileLines.push(...fileRecords);
    // Footer
    const footer = new CRAFileFooter();
    footer.transactionCode = TransactionCodes.MSFAARequestTrailer;
    footer.processDate = processDate;
    footer.sequence = fileSequence;
    footer.recordCount = msfaaRecords.length + 2; // Must be the number of records + header + footer.
    craFileLines.push(footer);

    return craFileLines;
  }
}
