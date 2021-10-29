import { Injectable } from "@nestjs/common";
import dayjs from "dayjs";
import { InjectLogger } from "src/common";
import { OfferingIntensity } from "src/database/entities";
import { LoggerService } from "src/logger/logger.service";
import { DATE_FORMAT } from "src/msfaa-integration/models/msfaa-integration.model";
import {
  ConfigService,
  SequenceControlService,
  SshService,
} from "src/services";
import { MSFAAIntegrationConfig, SFTPConfig } from "src/types";
import {
  getGenderCode,
  getMaritalStatusCode,
  getOfferingIntensityCode,
  getUTCNow,
} from "src/utilities";
import * as Client from "ssh2-sftp-client";
import {
  MSFAARecord,
  MSFAARequestFileLine,
  MSFAAUploadResult,
  TransactionCodes,
} from "./models/msfaa-integration.model";
import { MSFAAFileDetail } from "./msfaa-files/msfaa-request-file-detail";
import { MSFAAFileFooter } from "./msfaa-files/msfaa-request-file-footer";
import { MSFAAFileHeader } from "./msfaa-files/msfaa-request-file-header";

/**
 * Manages the creation of the content files that needs to be sent
 * to MSFAA validation. These files are created based
 * on a fixed size format and uploaded to a SFTP on Government
 * ZONE B network for further processing and final send to servers.
 */
@Injectable()
export class MSFAAIntegrationService {
  private readonly sequenceService: SequenceControlService;
  private readonly msfaaConfig: MSFAAIntegrationConfig;
  private readonly ftpConfig: SFTPConfig;

  constructor(config: ConfigService, private readonly sshService: SshService) {
    this.msfaaConfig = config.getConfig().MSFAAIntegration;
    this.ftpConfig = config.getConfig().zoneBSFTP;
  }

  /**
   * Create the MSFAA validation content, by populating the
   * Header, Detail and trailer records.
   * @param msfaaRecords - MSFAA, Student, User and application.
   * objects data.
   * @param fileSequence - Unique file sequence.
   * @param totalSINHash - Sum hash total of the Student's SIN.
   * @returns Complete MSFAAFileLines appending the header, footer
   * and trailer as an array.
   */

  createMSFAAValidationContent(
    msfaaRecords: MSFAARecord[],
    fileSequence: number,
    totalSINHash: number,
  ): MSFAARequestFileLine[] {
    const processDate = new Date();
    const msfaaFileLines: MSFAARequestFileLine[] = [];
    // Header record
    const msfaaHeader = new MSFAAFileHeader();
    msfaaHeader.transactionCode = TransactionCodes.MSFAARequestHeader;
    msfaaHeader.processDate = processDate;
    msfaaHeader.provinceCode = this.msfaaConfig.provinceCode;
    msfaaHeader.sequence = fileSequence;
    msfaaFileLines.push(msfaaHeader);
    // Detail records
    const fileRecords = msfaaRecords.map((msfaaRecord) => {
      const msfaaDetail = new MSFAAFileDetail();
      msfaaDetail.transactionCode = TransactionCodes.MSFAARequestDetail;
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
      msfaaDetail.addressLine2 = msfaaRecord.addressLine2;
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
    msfaaFooter.transactionCode = TransactionCodes.MSFAARequestTrailer;
    msfaaFooter.totalSINHash = totalSINHash;
    msfaaFooter.recordCount = msfaaRecords.length + 2; // Must be the number of records + header + footer.
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
  createRequestFileName(offeringIntensity: string): {
    fileName: string;
    filePath: string;
  } {
    let fileName = `PP${this.msfaaConfig.provinceCode}.EDU.MSFA.SENT.`;
    let fileNameSequence: number;
    if (OfferingIntensity.partTime === offeringIntensity) {
      fileName += "PT.";
    }
    fileName += dayjs(getUTCNow()).format(DATE_FORMAT);
    this.sequenceService.consumeNextSequence(
      fileName,
      async (nextSequenceNumber: number) => {
        fileNameSequence = nextSequenceNumber;
      },
    );
    fileName += `.${fileNameSequence}.DAT`;
    const filePath = `${this.msfaaConfig.ftpRequestFolder}\\${fileName}`;
    return {
      fileName,
      filePath,
    };
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
