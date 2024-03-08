import { Injectable } from "@nestjs/common";
import { LoggerService, InjectLogger } from "@sims/utilities/logger";
import * as Client from "ssh2-sftp-client";
import {
  MSFAASFTPResponseFile,
  ReceivedStatusCode,
  MSFAARecord,
  MSFAARequestFileLine,
  RecordTypeCodes,
} from "./models/msfaa-integration.model";
import { MSFAAFileDetail } from "./msfaa-files/msfaa-file-detail";
import { MSFAAFileFooter } from "./msfaa-files/msfaa-file-footer";
import { MSFAAFileHeader } from "./msfaa-files/msfaa-file-header";
import { MSFAAResponseReceivedRecord } from "./msfaa-files/msfaa-response-received-record";
import { MSFAAResponseCancelledRecord } from "./msfaa-files/msfaa-response-cancelled-record";
import { MSFAAResponseRecordIdentification } from "./msfaa-files/msfaa-response-record-identification";
import { ConfigService, ESDCIntegrationConfig } from "@sims/utilities/config";
import { SFTPIntegrationBase, SshService } from "@sims/integrations/services";
import {
  getGenderCode,
  getMaritalStatusCode,
  getOfferingIntensityCode,
  getFormattedPhone,
} from "@sims/utilities";
import { OfferingIntensity } from "@sims/sims-db";
import { FILE_DEFAULT_ENCODING } from "@sims/services/constants";

/**
 * Manages the creation of the content files that needs to be sent
 * to MSFAA request. These files are created based
 * on a fixed size format and uploaded to a SFTP on Government
 * ZONE B network for further processing and final send to servers.
 */
@Injectable()
export class MSFAAIntegrationService extends SFTPIntegrationBase<MSFAASFTPResponseFile> {
  private readonly esdcConfig: ESDCIntegrationConfig;

  constructor(config: ConfigService, sshService: SshService) {
    super(config.zoneBSFTP, sshService);
    this.esdcConfig = config.esdcIntegration;
  }

  /**
   * Create the MSFAA request content, by populating the
   * Header, Detail and trailer records.
   * @param msfaaRecords - MSFAA, Student, User and application.
   * objects data.
   * @param fileSequence unique file sequence.
   * @param totalSINHash sum hash total of the Student's SIN.
   * @param processDate process date to be added to the generated content.
   * @returns Complete MSFAAFileLines appending the header, footer
   * and trailer as an array.
   */
  createMSFAARequestContent(
    msfaaRecords: MSFAARecord[],
    fileSequence: number,
    totalSINHash: number,
    processDate: Date,
  ): MSFAARequestFileLine[] {
    const msfaaFileLines: MSFAARequestFileLine[] = [];
    // Header record
    const msfaaHeader = new MSFAAFileHeader();
    msfaaHeader.transactionCode = RecordTypeCodes.MSFAAHeader;
    msfaaHeader.processDate = processDate;
    msfaaHeader.sequence = fileSequence;
    msfaaFileLines.push(msfaaHeader);
    // Detail records
    const fileRecords = msfaaRecords.map((msfaaRecord) => {
      const msfaaDetail = new MSFAAFileDetail();
      msfaaDetail.transactionCode = RecordTypeCodes.MSFAADetail;
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
      msfaaDetail.provinceState = msfaaRecord.provinceState;
      msfaaDetail.postalCode = msfaaRecord.postalCode;
      msfaaDetail.country = msfaaRecord.country;
      msfaaDetail.phone = getFormattedPhone(msfaaRecord.phone);
      msfaaDetail.email = msfaaRecord.email;
      msfaaDetail.offeringIntensityCode = getOfferingIntensityCode(
        msfaaRecord.offeringIntensity,
      );
      return msfaaDetail;
    });
    msfaaFileLines.push(...fileRecords);
    // Footer or Trailer record
    const msfaaFooter = new MSFAAFileFooter();
    msfaaFooter.transactionCode = RecordTypeCodes.MSFAATrailer;
    msfaaFooter.totalSINHash = totalSINHash;
    msfaaFooter.recordCount = msfaaRecords.length;
    msfaaFileLines.push(msfaaFooter);

    return msfaaFileLines;
  }

  /**
   * Get the list of all response files waiting to be downloaded from the
   * SFTP filtering by the the regex pattern '/PE*\.txt/i'.
   * @param offeringIntensity offering intensity.
   * @returns full file paths for all response files present on SFTP.
   */
  async getResponseFilesFullPath(
    offeringIntensity: OfferingIntensity,
  ): Promise<string[]> {
    let filesToProcess: Client.FileInfo[];
    const client = await this.getClient();
    try {
      const pattern =
        offeringIntensity === OfferingIntensity.fullTime
          ? new RegExp(
              `^${this.esdcConfig.environmentCode}EDU\.PBC\.MSFA\.REC\.[0-9]{8}\.*`,
              "i",
            )
          : new RegExp(
              `^${this.esdcConfig.environmentCode}EDU\.PBC\.MSFA\.REC\.PT\.[0-9]{8}\.*`,
              "i",
            );
      filesToProcess = await client.list(
        `${this.esdcConfig.ftpResponseFolder}`,
        (item: Client.FileInfo) => pattern.test(item.name),
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
      // Read all the file content and create a buffer with 'ascii' encoding.
      const fileContent = await client.get(filePath, undefined, {
        readStreamOptions: { encoding: FILE_DEFAULT_ENCODING },
      });
      // Convert the file content to an array of text lines and remove possible blank lines.
      const fileLines = fileContent
        .toString()
        .split(/\r\n|\n\r|\n|\r/)
        .filter((line) => line.length > 0);
      // Read the first line to check if the header code is the expected one.
      const header = MSFAAFileHeader.createFromLine(fileLines.shift()); // Read and remove header.
      if (header.transactionCode !== RecordTypeCodes.MSFAAHeader) {
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
      if (trailer.transactionCode !== RecordTypeCodes.MSFAATrailer) {
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
      let lineNumber = 2; // Take into account the removed header line.
      const receivedRecords: MSFAAResponseReceivedRecord[] = [];
      const cancelledRecords: MSFAAResponseCancelledRecord[] = [];
      let sinTotalInRecord = 0;
      for (const line of fileLines) {
        const msfaaRecord = new MSFAAResponseRecordIdentification(
          line,
          lineNumber,
        );
        sinTotalInRecord += parseInt(msfaaRecord.sin);
        switch (msfaaRecord.statusCode) {
          case ReceivedStatusCode.Received:
            receivedRecords.push(
              new MSFAAResponseReceivedRecord(line, lineNumber),
            );
            break;
          case ReceivedStatusCode.Cancelled:
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

  @InjectLogger()
  logger: LoggerService;
}
