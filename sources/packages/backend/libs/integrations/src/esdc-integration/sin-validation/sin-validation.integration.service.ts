import { LoggerService, InjectLogger } from "@sims/utilities/logger";
import { Injectable } from "@nestjs/common";
import { SINValidationFileResponse } from "./sin-validation-files/sin-validation-file-response";
import { SINValidationFileHeader } from "./sin-validation-files/sin-validation-file-header";
import {
  NUMBER_FILLER,
  PROVINCE_CODE,
  RecordTypeCodes,
  SINValidationRecord,
  SINValidationResponseResult,
} from "./models/sin-validation-models";
import { SINValidationFileFooter } from "./sin-validation-files/sin-validation-file-footer";
import { CreateRequestFileNameResult } from "../models/esdc-integration.model";
import { SINValidationFileRequest } from "./sin-validation-files/sin-validation-file-request";
import { ConfigService, ESDCIntegrationConfig } from "@sims/utilities/config";
import { SFTPIntegrationBase, SshService } from "@sims/integrations/services";
import { FixedFormatFileLine } from "@sims/integrations/services/ssh";
import { getGenderCode, StringBuilder } from "@sims/utilities";

@Injectable()
export class SINValidationIntegrationService extends SFTPIntegrationBase<SINValidationResponseResult> {
  private readonly esdcConfig: ESDCIntegrationConfig;
  constructor(config: ConfigService, sshService: SshService) {
    super(config.zoneBSFTP, sshService);
    this.esdcConfig = config.esdcIntegration;
  }

  /**
   * Create the file content to be uploaded to ESDC to execute
   * the SIN validation.
   * @param records records to be uploaded in the file.
   * @param sequenceNumber file sequence number.
   * @returns content to be uploaded to ESDC to execute
   * the SIN validation (header, records, footer).
   */
  createRequestFileContent(
    records: SINValidationRecord[],
    sequenceNumber: number,
  ): FixedFormatFileLine[] {
    const processDate = new Date();
    const fileLines: FixedFormatFileLine[] = [];
    // Header
    const header = new SINValidationFileHeader();
    header.recordTypeCode = RecordTypeCodes.Header;
    header.processDate = processDate;
    header.batchNumber = sequenceNumber;
    fileLines.push(header);
    // Records
    const fileRecords = records.map((record) => {
      const sinRecord = new SINValidationFileRequest();
      sinRecord.firstName = record.firstName;
      sinRecord.lastName = record.lastName;
      sinRecord.sin = record.sin;
      sinRecord.birthDate = new Date(record.birthDate);
      sinRecord.referenceIndex = record.sinValidationId;
      sinRecord.gender = getGenderCode(record.gender);
      return sinRecord;
    });
    fileLines.push(...fileRecords);
    // Footer
    const footer = new SINValidationFileFooter();
    footer.recordTypeCode = RecordTypeCodes.Footer;
    footer.recordCount = fileRecords.length;
    footer.totalSINHash = fileRecords.reduce(
      (hash, record) => hash + +record.sin,
      0,
    );
    fileLines.push(footer);

    return fileLines;
  }

  /**
   * Define the file name and location in the SFTP to upload the ESDC SIN
   * validation request file.
   * @param sequenceNumber sequence number of the file.
   * @returns file name and location in the SFTP to upload the ESDC SIN
   * validation request file.
   */
  createRequestFileName(sequenceNumber: number): CreateRequestFileNameResult {
    const fileNameBuilder = new StringBuilder();
    fileNameBuilder.append(PROVINCE_CODE);
    fileNameBuilder.appendWithStartFiller(sequenceNumber, 4, NUMBER_FILLER);
    fileNameBuilder.append(".OS");

    const fileName = fileNameBuilder.toString();
    const filePath = `${this.esdcConfig.ftpRequestFolder}\\${fileName}`;

    return { fileName, filePath };
  }

  /**
   * Downloads the file specified on 'remoteFilePath' parameter from the
   * ESDC SIN validation integration folder on the SFTP.
   * @param remoteFilePath full remote file path with file name.
   * @returns parsed records from the file.
   */
  async downloadResponseFile(
    remoteFilePath: string,
  ): Promise<SINValidationResponseResult> {
    const fileLines = await this.downloadResponseFileLines(remoteFilePath);
    // Read the first line to check if the header code is the expected one.
    const header = SINValidationFileHeader.createFromFile(fileLines.shift()); // Read and remove header.
    if (header.recordTypeCode !== RecordTypeCodes.Header) {
      this.logger.error(
        `The ESDC SIN validation file ${remoteFilePath} has an invalid transaction code on header: ${header.recordTypeCode}`,
      );
      // If the header is not the expected one, throw an error.
      throw new Error("Invalid file header.");
    }

    // Remove the footer.
    // Not part of the processing.
    const footer = SINValidationFileFooter.createFromLine(fileLines.pop());
    if (footer.recordTypeCode !== RecordTypeCodes.Footer) {
      this.logger.error(
        `The ESDC SIN validation file ${remoteFilePath} has an invalid transaction code on footer: ${footer.recordTypeCode}`,
      );
      // If the footer is not the expected one, throw an error.
      throw new Error("Invalid file footer.");
    }

    // Generate the records.
    const records = fileLines.map(
      // 1 is the header already removed.
      (line, index) => new SINValidationFileResponse(line, index + 2),
    );

    // Check the SIN hash before return the results.
    const totalSINHash = records.reduce(
      (hash, record) => hash + +record.sin,
      0,
    );
    if (totalSINHash !== footer.totalSINHash) {
      throw new Error("SIN hash does not match with the expected on footer.");
    }

    return { header, records };
  }

  @InjectLogger()
  logger: LoggerService;
}
