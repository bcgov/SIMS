import { Injectable } from "@nestjs/common";
import { ConfigService, SshService } from "../../../services";
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
  RecordTypeCodes,
  Award,
  ECertRecord,
} from "../models/e-cert-integration-model";
import { FixedFormatFileLine } from "../../../services/ssh/sftp-integration-base.models";
import { ECertFullTimeFileHeader } from "./e-cert-files/e-cert-file-header";
import { ECertFullTimeFileFooter } from "./e-cert-files/e-cert-file-footer";
import { ECertFullTimeFileRecord } from "./e-cert-files/e-cert-file-record";
import {
  DisbursementValueType,
  OfferingIntensity,
} from "../../../database/entities";
import { ECertIntegrationService } from "../e-cert-integration.service";
import { ECertResponseRecord } from "../e-cert-files/e-cert-response-record";

/**
 * Manages the file content generation and methods to
 * upload/download the files to SFTP.
 */
@Injectable()
export class ECertFullTimeIntegrationService extends ECertIntegrationService {
  constructor(
    private readonly eCertFullTimeFileHeader: ECertFullTimeFileHeader,
    private readonly eCertFullTimeFileFooter: ECertFullTimeFileFooter,
    config: ConfigService,
    sshService: SshService,
  ) {
    super(config.getConfig().zoneBSFTP, sshService);
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
    const header = new ECertFullTimeFileHeader();
    header.recordTypeCode = RecordTypeCodes.ECertFullTimeHeader;
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

      const record = new ECertFullTimeFileRecord();
      record.recordType = RecordTypeCodes.ECertFullTimeRecord;
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
      record.country = ecertRecord.country;
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
    const footer = new ECertFullTimeFileFooter();
    footer.recordTypeCode = RecordTypeCodes.ECertFullTimeFooter;
    footer.totalSINHash = totalSINHash;
    footer.recordCount = fileRecords.length;
    fileLines.push(footer);

    return fileLines;
  }

  /**
   * This method will call the appropriate common implementation by passing the appropriate parameters.
   * @param remoteFilePath E-Cert response file to be processed.
   * @returns Parsed records from the file.
   */
  downloadResponseFile(remoteFilePath: string): Promise<ECertResponseRecord[]> {
    return this.downloadECertResponseFile(
      remoteFilePath,
      this.eCertFullTimeFileHeader,
      this.eCertFullTimeFileFooter,
      OfferingIntensity.fullTime,
    );
  }
}
