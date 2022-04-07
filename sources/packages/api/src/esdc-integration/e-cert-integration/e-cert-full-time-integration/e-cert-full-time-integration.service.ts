import { Injectable } from "@nestjs/common";
import { ConfigService, SshService } from "../../../services";
import { ESDCIntegrationConfig } from "../../../types";
import {
  combineDecimalPlaces,
  getDisbursementValuesByType,
  getGenderCode,
  getMaritalStatusCode,
  getTotalDisbursementAmount,
  getTotalYearsOfStudy,
  round,
} from "../../../utilities";
import {
  Award,
  ECertFTRecord,
  RecordTypeCodes,
} from "./models/e-cert-full-time-integration.model";
import { SFTPIntegrationBase } from "../../../services/ssh/sftp-integration-base";
import { FixedFormatFileLine } from "../../../services/ssh/sftp-integration-base.models";
import { ECertFTFileHeader } from "./e-cert-files/e-cert-file-header";
import { ECertFTFileFooter } from "./e-cert-files/e-cert-file-footer";
import { ECertFTFileRecord } from "./e-cert-files/e-cert-file-record";
import { DisbursementValueType } from "../../../database/entities";
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

  constructor(config: ConfigService, sshService: SshService) {
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
    ecertRecords: ECertFTRecord[],
    fileSequence: number,
  ): FixedFormatFileLine[] {
    const fileLines: FixedFormatFileLine[] = [];
    // Header record
    const header = new ECertFTFileHeader();
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

      const record = new ECertFTFileRecord();
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
    const footer = new ECertFTFileFooter();
    footer.recordTypeCode = RecordTypeCodes.ECertFooter;
    footer.totalSINHash = totalSINHash;
    footer.recordCount = fileRecords.length;
    fileLines.push(footer);

    return fileLines;
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
    const header = ECertFTFileHeader.createFromLine(fileLines.shift());
    if (header.recordTypeCode !== RecordTypeCodes.ECertHeader) {
      this.logger.error(
        `The E-Cert file ${remoteFilePath} has an invalid record type code on header: ${header.recordTypeCode}`,
      );
      // If the header is not the expected one.
      throw new Error(
        "The E-Cert file has an invalid record type code on header",
      );
    }

    /**
     * Read the last line to check if the trailer code is the expected one
     * and remove trailer line.
     */
    const trailer = ECertFTFileFooter.createFromLine(fileLines.pop());
    if (trailer.recordTypeCode !== RecordTypeCodes.ECertFooter) {
      this.logger.error(
        `The E-Cert file ${remoteFilePath} has an invalid record type code on trailer: ${trailer.recordTypeCode}`,
      );
      // If the trailer is not the expected one.
      throw new Error(
        "The E-Cert file has an invalid record type code on trailer",
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
    let sumOfAllSin = 0;
    fileLines.forEach((line: string, index: number) => {
      const lineNumber = index + 2;
      const eCertRecord = new ECertResponseRecord(line, lineNumber);
      sumOfAllSin += eCertRecord.sin;
      feedbackRecords.push(eCertRecord);
    });
    /**
     * Check if the sum total SIN in the records match the trailer SIN hash total
     */
    if (sumOfAllSin !== trailer.totalSINHash) {
      this.logger.error(
        `The E-Cert file ${remoteFilePath} has SINHash inconsistent with the total sum of sin in the records`,
      );
      // If the Sum hash total of SIN in the records does not match the trailer SIN hash total count.
      throw new Error(
        "The E-Cert file has TotalSINHash inconsistent with the total sum of sin in the records",
      );
    }
    return feedbackRecords;
  }
}
