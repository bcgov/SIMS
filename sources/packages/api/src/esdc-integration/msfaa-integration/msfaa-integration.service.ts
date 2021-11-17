import { Injectable } from "@nestjs/common";
import { InjectLogger } from "../../common";
import { OfferingIntensity } from "../../database/entities";
import { LoggerService } from "../../logger/logger.service";
import {
  DATE_FORMAT,
  MSFAASFTPResponseFile,
  TransactionSubCodes,
} from "../msfaa-integration/models/msfaa-integration.model";
import { ConfigService, SequenceControlService, SshService } from "../services";
import { SFTPConfig, ESDCIntegrationConfig } from "../../types";
import {
  getGenderCode,
  getMaritalStatusCode,
  getOfferingIntensityCode,
} from "../../utilities";
import * as Client from "ssh2-sftp-client";
import {
  MSFAARecord,
  MSFAARequestFileLine,
  MSFAAUploadResult,
  TransactionCodes,
} from "./models/msfaa-integration.model";
import { MSFAAFileDetail } from "./msfaa-files/msfaa-file-detail";
import { MSFAAFileFooter } from "./msfaa-files/msfaa-file-footer";
import { MSFAAFileHeader } from "./msfaa-files/msfaa-file-header";
import { StringBuilder } from "../../utilities/string-builder";
import { EntityManager } from "typeorm";
import { MSFAAResponseReceivedRecord } from "./msfaa-files/msfaa-response-received-record";
import { MSFAAResponseCancelledRecord } from "./msfaa-files/msfaa-response-cancelled-record";
import { MSFAAResponseRecordIdentification } from "./msfaa-files/msfaa-response-record-identification";

/**
 * Manages the creation of the content files that needs to be sent
 * to MSFAA request. These files are created based
 * on a fixed size format and uploaded to a SFTP on Government
 * ZONE B network for further processing and final send to servers.
 */
@Injectable()
export class MSFAAIntegrationService {
  private readonly esdcConfig: ESDCIntegrationConfig;
  private readonly ftpConfig: SFTPConfig;

  constructor(
    config: ConfigService,
    private readonly sequenceService: SequenceControlService,
    private readonly sshService: SshService,
  ) {
    this.esdcConfig = config.getConfig().MSFAAIntegration;
    this.ftpConfig = config.getConfig().zoneBSFTP;
  }

  /**
   * Create the MSFAA request content, by populating the
   * Header, Detail and trailer records.
   * @param msfaaRecords - MSFAA, Student, User and application.
   * objects data.
   * @param fileSequence - Unique file sequence.
   * @param totalSINHash - Sum hash total of the Student's SIN.
   * @returns Complete MSFAAFileLines appending the header, footer
   * and trailer as an array.
   */
  createMSFAARequestContent(
    msfaaRecords: MSFAARecord[],
    fileSequence: number,
    totalSINHash: number,
  ): MSFAARequestFileLine[] {
    const processDate = new Date();
    const msfaaFileLines: MSFAARequestFileLine[] = [];
    // Header record
    const msfaaHeader = new MSFAAFileHeader();
    msfaaHeader.transactionCode = TransactionCodes.MSFAAHeader;
    msfaaHeader.processDate = processDate;
    msfaaHeader.provinceCode = this.esdcConfig.originatorCode;
    msfaaHeader.sequence = fileSequence;
    msfaaFileLines.push(msfaaHeader);
    // Detail records
    const fileRecords = msfaaRecords.map((msfaaRecord) => {
      const msfaaDetail = new MSFAAFileDetail();
      msfaaDetail.transactionCode = TransactionCodes.MSFAADetail;
      msfaaHeader.processDate = processDate;
      msfaaDetail.msfaaNumber = msfaaRecord.msfaaNumber;
      msfaaDetail.sin = msfaaRecord.sin;
      msfaaDetail.institutionCode = msfaaRecord.institutionCode;
      msfaaDetail.birthDate = msfaaRecord.birthDate;
      msfaaDetail.surname = msfaaRecord.surname;
      msfaaDetail.givenName = msfaaRecord.givenName;
      msfaaDetail.genderCode = getGenderCode(msfaaRecord.gender);
      msfaaDetail.maritalStatusCode = getMaritalStatusCode(
        msfaaRecord.maritalStatus,
      );
      msfaaDetail.addressLine1 = msfaaRecord.addressLine1;
      msfaaDetail.addressLine2 = msfaaRecord.addressLine2 ?? "";
      msfaaDetail.city = msfaaRecord.city;
      msfaaDetail.province = msfaaRecord.province;
      msfaaDetail.postalCode = msfaaRecord.postalCode;
      msfaaDetail.country = msfaaRecord.country;
      msfaaDetail.phone = msfaaRecord.phone;
      msfaaDetail.email = msfaaRecord.email;
      msfaaDetail.offeringIntensityCode = getOfferingIntensityCode(
        msfaaRecord.offeringIntensity,
      );
      return msfaaDetail;
    });
    msfaaFileLines.push(...fileRecords);
    // Footer or Trailer record
    const msfaaFooter = new MSFAAFileFooter();
    msfaaFooter.transactionCode = TransactionCodes.MSFAATrailer;
    msfaaFooter.totalSINHash = totalSINHash;
    msfaaFooter.recordCount = msfaaRecords.length;
    msfaaFileLines.push(msfaaFooter);

    return msfaaFileLines;
  }

  /**
   * Converts the MSFAAFileLines to the final content and upload it.
   * @param MSFAAFileLines Array of lines to be converted to a formatted fixed size file.
   * @param remoteFilePath Remote location to upload the file (path + file name).
   * @returns Upload result.
   */
  async uploadContent(
    msfaaFileLines: MSFAARequestFileLine[],
    remoteFilePath: string,
  ): Promise<MSFAAUploadResult> {
    // Generate fixed formatted file.
    const fixedFormattedLines: string[] = msfaaFileLines.map(
      (line: MSFAARequestFileLine) => line.getFixedFormat(),
    );
    const msfaaFileContent = fixedFormattedLines.join("\r\n");

    // Send the file to ftp.
    this.logger.log("Creating new SFTP client to start upload...");
    const client = await this.getClient();
    try {
      this.logger.log(`Uploading ${remoteFilePath}`);
      await client.put(Buffer.from(msfaaFileContent), remoteFilePath);
      return {
        generatedFile: remoteFilePath,
        uploadedRecords: msfaaFileLines.length - 2, // Do not consider header/footer.
      };
    } finally {
      this.logger.log("Finalizing SFTP client...");
      await SshService.closeQuietly(client);
      this.logger.log("SFTP client finalized.");
    }
  }

  /**
   * Expected file name of the MSFAA request file.
   * for Part time the format is PPxx.EDU.MSFA.SENT.PT.YYYYMMDD.sss
   * for full time the format is PPxx.EDU.MSFA.SENT.YYYYMMDD.sss
   * xx is the province code currently its BC
   * sss is a sequence that should be resetted every day
   * @param OfferingIntensity offering intensity of the application
   *  where MSFAA is requested.
   * @returns Full file path of the file to be saved on the SFTP.
   */
  async createRequestFileName(
    offeringIntensity: string,
    entityManager?: EntityManager,
  ): Promise<{
    fileName: string;
    filePath: string;
  }> {
    const fileNameArray = new StringBuilder();
    fileNameArray.append(`PP${this.esdcConfig.originatorCode}.EDU.MSFA.SENT.`);
    let fileNameSequence: number;
    if (OfferingIntensity.partTime === offeringIntensity) {
      fileNameArray.append("PT.");
    }
    fileNameArray.appendDate(new Date(), DATE_FORMAT);
    await this.sequenceService.consumeNextSequenceWithExistingEntityManager(
      fileNameArray.toString(),
      entityManager,
      async (nextSequenceNumber: number) => {
        fileNameSequence = nextSequenceNumber;
      },
    );
    fileNameArray.append(".");
    fileNameArray.appendWithStartFiller(fileNameSequence.toString(), 3, "0");
    fileNameArray.append(".DAT");
    const fileName = fileNameArray.toString();
    const filePath = `${this.esdcConfig.ftpRequestFolder}\\${fileName}`;
    return {
      fileName,
      filePath,
    };
  }

  /**
   * Get the list of all response files waiting to be downloaded from the
   * SFTP filtering by the the regex pattern '/PE*\.txt/i'.
   * @returns full file paths for all response files present on SFTP.
   */
  async getResponseFilesFullPath(): Promise<string[]> {
    let filesToProcess: Client.FileInfo[];
    const client = await this.getClient();
    try {
      filesToProcess = await client.list(
        `${this.esdcConfig.ftpResponseFolder}`,
        /PEDU.PBC.MSFA.REC.*\.DAT/i,
      );
    } finally {
      await SshService.closeQuietly(client);
    }
    return filesToProcess.map((file) => file.name);
  }

  /**
   * Downloads the file specified on 'fileName' parameter from the
   * MSFAA response folder on the SFTP.
   * @param fileName File to be downloaded.
   * @returns Parsed records from the file.
   */
  async downloadResponseFile(fileName: string): Promise<MSFAASFTPResponseFile> {
    const client = await this.getClient();
    try {
      const filePath = `${this.esdcConfig.ftpResponseFolder}/${fileName}`;
      // Read all the file content and create a buffer.
      const fileContent = await client.get(filePath);
      // Convert the file content to an array of text lines and remove possible blank lines.
      const fileLines = fileContent
        .toString()
        .split(/\r\n|\n\r|\n|\r/)
        .filter((line) => line.length > 0);
      // Read the first line to check if the header code is the expected one.
      const header = MSFAAFileHeader.createFromLine(fileLines.shift()); // Read and remove header.
      if (header.transactionCode !== TransactionCodes.MSFAAHeader) {
        this.logger.error(
          `The MSFAA file ${fileName} has an invalid transaction code on header: ${header.transactionCode}`,
        );
        // If the header is not the expected one.
        throw new Error(
          "The MSFAA file has an invalid transaction code on header",
        );
      }

      /** Read the last line to check if the trailer code is the expected one and fetch the Hash
       * total of all the SIN values
       */
      const trailer = MSFAAFileFooter.createFromLine(fileLines.pop()); // Read and remove trailer.
      if (trailer.transactionCode !== TransactionCodes.MSFAATrailer) {
        this.logger.error(
          `The MSFAA file ${fileName} has an invalid transaction code on trailer: ${trailer.transactionCode}`,
        );
        // If the trailer is not the expected one.
        throw new Error(
          "The MSFAA file has an invalid transaction code on trailer",
        );
      }

      /**
       * Check if the number of records match the trailer record count
       */
      if (trailer.recordCount !== fileLines.length) {
        this.logger.error(
          `The MSFAA file ${fileName} has invalid number of records, expected ${trailer.recordCount} but got ${fileLines.length}`,
        );
        // If the number of records does not match the trailer record count..
        throw new Error("The MSFAA file has invalid number of records");
      }

      // Generate the records.
      let lineNumber = 1;
      const receivedRecords: MSFAAResponseReceivedRecord[] = [];
      const cancelledRecords: MSFAAResponseCancelledRecord[] = [];
      let sinTotalInRecord = 0;
      for (const line of fileLines) {
        const msfaaRecord = new MSFAAResponseRecordIdentification(
          line,
          lineNumber,
        );
        sinTotalInRecord += parseInt(msfaaRecord.sin);
        switch (msfaaRecord.transactionSubCode) {
          case TransactionSubCodes.Received:
            receivedRecords.push(
              new MSFAAResponseReceivedRecord(line, lineNumber),
            );
            break;
          case TransactionSubCodes.Cancelled:
            cancelledRecords.push(
              new MSFAAResponseCancelledRecord(line, lineNumber),
            );
            break;
        }
        lineNumber++;
      }
      /**
       * Check if the sum total hash of SIN in the records match the trailer SIN hash total
       */
      if (sinTotalInRecord !== trailer.totalSINHash) {
        this.logger.error(
          `The MSFAA file ${fileName} has SINHash inconsistent with the total sum of sin in the records`,
        );
        // If the Sum hash total of SIN in the records does not match the trailer SIN hash total count.
        throw new Error(
          "The MSFAA file has TotalSINHash inconsistent with the total sum of sin in the records",
        );
      }

      return {
        fileName,
        filePath,
        receivedRecords,
        cancelledRecords,
      };
    } finally {
      await SshService.closeQuietly(client);
    }
  }

  /**
   * Delete a file from SFTP.
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
   * Generates a new connected SFTP client ready to be used.
   * @returns client
   */
  private async getClient(): Promise<Client> {
    return this.sshService.createClient(this.ftpConfig);
  }

  @InjectLogger()
  logger: LoggerService;
}
