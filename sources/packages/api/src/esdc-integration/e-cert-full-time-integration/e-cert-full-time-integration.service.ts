import { Injectable } from "@nestjs/common";
import {
  ConfigService,
  SequenceControlService,
  SshService,
} from "../../services";
import { ESDCIntegrationConfig } from "../../types";
import {
  combineDecimalPlaces,
  getDayOfTheYear,
  getDisbursementValuesByType,
  getGenderCode,
  getMaritalStatusCode,
  getTotalDisbursementAmount,
  getTotalYearsOfStudy,
  round,
} from "../../utilities";
import {
  Award,
  CreateRequestFileNameResult,
  ECertRecord,
  NUMBER_FILLER,
  RecordTypeCodes,
} from "./models/e-cert-full-time-integration.model";
import { StringBuilder } from "../../utilities/string-builder";
import { EntityManager } from "typeorm";
import { SFTPIntegrationBase } from "../../services/ssh/sftp-integration-base";
import { FixedFormatFileLine } from "../../services/ssh/sftp-integration-base.models";
import { ECertFileHeader } from "./e-cert-files/e-cert-file-header";
import { ECertFileFooter } from "./e-cert-files/e-cert-file-footer";
import { ECertFileRecord } from "./e-cert-files/e-cert-file-record";
import { DisbursementValueType } from "../../database/entities";
import * as Client from "ssh2-sftp-client";
import { ECertResponseRecord } from "./e-cert-files/e-cert-response-record";

/**
 * Manages the file content generation and methods to
 * upload/download the files to SFTP.
 */
@Injectable()
export class ECertFullTimeIntegrationService extends SFTPIntegrationBase<
  ECertResponseRecord[]
> {
  private readonly esdcConfig: ESDCIntegrationConfig;

  constructor(
    config: ConfigService,
    sshService: SshService,
    private readonly sequenceService: SequenceControlService,
  ) {
    super(config.getConfig().zoneBSFTP, sshService);
    this.esdcConfig = config.getConfig().ESDCIntegration;
  }

  /**
   * Create the ECert file content, by populating the
   * header, detail and trailer records.
   * @param ecertRecords student, User and application data.
   * @param fileSequence unique file sequence.
   * @returns complete ECert content to be sent.
   */
  createRequestContent(
    ecertRecords: ECertRecord[],
    fileSequence: number,
  ): FixedFormatFileLine[] {
    const fileLines: FixedFormatFileLine[] = [];
    // Header record
    const header = new ECertFileHeader();
    header.recordTypeCode = RecordTypeCodes.ECertHeader;
    header.processDate = new Date();
    header.sequence = fileSequence;
    fileLines.push(header);

    // Detail records

    // Calculated values.

    const fileRecords = ecertRecords.map((ecertRecord) => {
      // ! All dollar values must be rounded to the nearest integer (0.5 rounds up)
      const roundedAwards = ecertRecord.awards.map(
        (award) =>
          ({
            valueType: award.valueType,
            valueCode: award.valueCode,
            valueAmount: round(award.valueAmount).toString(),
          } as Award),
      );

      const disbursementAmount = getTotalDisbursementAmount(roundedAwards, [
        DisbursementValueType.CanadaLoan,
        DisbursementValueType.BCLoan,
        DisbursementValueType.CanadaGrant,
        DisbursementValueType.BCTotalGrant,
      ]);

      // ! All dollar values must be rounded to the nearest integer (0.5 rounds up)
      // ! except studentAmount and schoolAmount that must have the decimal part
      // ! combined into the integer part because the schoolAmount contains decimals
      // ! and schoolAmount is used to determine the studentAmount.
      const studentAmount = disbursementAmount - ecertRecord.schoolAmount;

      const cslAwardAmount = getTotalDisbursementAmount(roundedAwards, [
        DisbursementValueType.CanadaLoan,
      ]);
      const bcslAwardAmount = getTotalDisbursementAmount(roundedAwards, [
        DisbursementValueType.BCLoan,
      ]);
      const totalGrantAmount = getTotalDisbursementAmount(roundedAwards, [
        DisbursementValueType.CanadaGrant,
        DisbursementValueType.BCTotalGrant,
      ]);

      const record = new ECertFileRecord();
      record.recordType = RecordTypeCodes.ECertRecord;
      record.sin = ecertRecord.sin;
      record.applicationNumber = ecertRecord.applicationNumber;
      record.documentNumber = ecertRecord.documentNumber;
      record.disbursementDate = ecertRecord.disbursementDate;
      record.documentProducedDate = ecertRecord.documentProducedDate;
      record.negotiatedExpiryDate = ecertRecord.negotiatedExpiryDate;
      record.disbursementAmount = disbursementAmount;
      record.studentAmount = combineDecimalPlaces(studentAmount);
      record.schoolAmount = combineDecimalPlaces(ecertRecord.schoolAmount);
      record.cslAwardAmount = cslAwardAmount;
      record.bcslAwardAmount = bcslAwardAmount;
      record.educationalStartDate = ecertRecord.educationalStartDate;
      record.educationalEndDate = ecertRecord.educationalEndDate;
      record.federalInstitutionCode = ecertRecord.federalInstitutionCode;
      record.weeksOfStudy = ecertRecord.weeksOfStudy;
      record.fieldOfStudy = ecertRecord.fieldOfStudy;
      record.yearOfStudy = ecertRecord.yearOfStudy;
      record.totalYearsOfStudy = getTotalYearsOfStudy(
        ecertRecord.completionYears,
      );
      record.enrollmentConfirmationDate =
        ecertRecord.enrollmentConfirmationDate;
      record.dateOfBirth = ecertRecord.dateOfBirth;
      record.lastName = ecertRecord.lastName;
      record.firstName = ecertRecord.firstName;
      record.addressLine1 = ecertRecord.addressLine1;
      record.addressLine2 = ecertRecord.addressLine2;
      record.city = ecertRecord.city;
      record.countryName = ecertRecord.country;
      record.emailAddress = ecertRecord.email;
      record.gender = getGenderCode(ecertRecord.gender);
      record.maritalStatus = getMaritalStatusCode(ecertRecord.maritalStatus);
      record.studentNumber = ecertRecord.studentNumber;
      record.totalGrantAmount = totalGrantAmount;
      record.grantAwards = getDisbursementValuesByType(roundedAwards, [
        DisbursementValueType.CanadaGrant,
        DisbursementValueType.BCTotalGrant,
      ]);

      return record;
    });
    fileLines.push(...fileRecords);

    // Footer or Trailer record

    // Total hash of the Student's SIN.
    const totalSINHash = ecertRecords.reduce(
      (hash, record) => hash + +record.sin,
      0,
    );
    const footer = new ECertFileFooter();
    footer.recordTypeCode = RecordTypeCodes.ECertFooter;
    footer.totalSINHash = totalSINHash;
    footer.recordCount = fileRecords.length;
    fileLines.push(footer);

    return fileLines;
  }

  /**
   * Define the e-Cert file name that must be uploaded.
   * It must follow a pattern like 'PPBC.EDU.ECERTS.Dyyyyjjj.001.DAT'.
   * @param entityManager allows the sequential number to be part of
   * the transaction that is used to create sequential number and execute
   * DB changes.
   * @returns fileName and full remote file path that the file must be uploaded.
   */
  async createRequestFileName(
    entityManager?: EntityManager,
  ): Promise<CreateRequestFileNameResult> {
    const fileNameArray = new StringBuilder();
    const now = new Date();
    const dayOfTheYear = getDayOfTheYear(now)
      .toString()
      .padStart(3, NUMBER_FILLER);
    fileNameArray.append(
      `${
        this.esdcConfig.environmentCode
      }PBC.EDU.ECERTS.D${now.getFullYear()}${dayOfTheYear}`,
    );
    let fileNameSequence: number;
    await this.sequenceService.consumeNextSequenceWithExistingEntityManager(
      fileNameArray.toString(),
      entityManager,
      async (nextSequenceNumber: number) => {
        fileNameSequence = nextSequenceNumber;
      },
    );
    fileNameArray.append(".");
    fileNameArray.appendWithStartFiller(
      fileNameSequence.toString(),
      3,
      NUMBER_FILLER,
    );
    fileNameArray.append(".DAT");
    const fileName = fileNameArray.toString();
    const filePath = `${this.esdcConfig.ftpRequestFolder}\\${fileName}`;
    return {
      fileName,
      filePath,
    } as CreateRequestFileNameResult;
  }

  /**
   * Get the list of all E-Cert response files from the folder
   * TODO: NAME OF THE FOLDER
   * Filename pattern is `PEDU.PBC.CERTSFB.yyyymmdd.001`
   * @returns full file paths for all response files from the
   * E-Cert response folder.
   */
  async getResponseFilesFullPath(): Promise<string[]> {
    let filesToProcess: Client.FileInfo[];
    const client = await this.getClient();
    try {
      filesToProcess = await client.list(
        `${this.esdcConfig.ftpResponseFolder}`,
        /PEDU.PBC.CERTSFB.*\.DAT/i,
      );
    } finally {
      await SshService.closeQuietly(client);
    }
    return filesToProcess.map((file) => file.name);
  }

  // Generate Record

  /**
   * Transform the text lines in parsed objects specific to the integration process.
   * @param remoteFilePath full remote file path with file name.
   * @returns Parsed records from the file.
   */
  async downloadResponseFile(
    remoteFilePath: string,
  ): Promise<ECertResponseRecord[]> {
    const fileLines = await this.downloadResponseFileLines(remoteFilePath);
    /**
     * Read the first line to check if the header code is the expected one.
     * and remove header.
     */
    const header = ECertFileHeader.createFromLine(fileLines.shift());
    if (header.recordTypeCode !== RecordTypeCodes.ECertHeader) {
      this.logger.error(
        `The E-Cert file ${remoteFilePath} has an invalid transaction code on header: ${header.recordTypeCode}`,
      );
      // If the header is not the expected one.
      throw new Error(
        "The E-Cert file has an invalid transaction code on header",
      );
    }

    /**
     * Read the last line to check if the trailer code is the expected one
     * and remove trailer line.
     */
    const trailer = ECertFileFooter.createFromLine(fileLines.pop());
    if (trailer.recordTypeCode !== RecordTypeCodes.ECertFooter) {
      this.logger.error(
        `The E-Cert file ${remoteFilePath} has an invalid transaction code on trailer: ${trailer.recordTypeCode}`,
      );
      // If the trailer is not the expected one.
      throw new Error(
        "The E-Cert file has an invalid transaction code on trailer",
      );
    }

    /**
     * Check if the number of records match the trailer record count
     * Here total record count is the total records rejected
     */
    if (trailer.recordCount !== fileLines.length) {
      this.logger.error(
        `The E-Cert file ${remoteFilePath} has invalid number of records, expected ${trailer.recordCount} but got ${fileLines.length}`,
      );
      // If the number of records does not match the trailer record count..
      throw new Error("The E-Cert file has invalid number of records");
    }

    // Generate the records.
    const feedbackRecords: ECertResponseRecord[] = [];
    fileLines.forEach((line: string, index: number) => {
      const lineNumber = index + 1;
      const craRecord = new ECertResponseRecord(line, lineNumber);
      feedbackRecords.push(craRecord);
    });
    return feedbackRecords;
  }
}
