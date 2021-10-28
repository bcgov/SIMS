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
    this.logger.log("Creating new SFTP client to start upload...");
    const client = await this.getClient();
    try {
      this.logger.log(`Uploading ${remoteFilePath}`);
      await client.put(Buffer.from(craFileContent), remoteFilePath);
      return {
        generatedFile: remoteFilePath,
        uploadedRecords: craFileLines.length - 2, // Do not consider header/footer.
      };
    } finally {
      this.logger.log("Finalizing SFTP client...");
      await SshService.closeQuietly(client);
      this.logger.log("SFTP client finalized.");
    }
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
}
