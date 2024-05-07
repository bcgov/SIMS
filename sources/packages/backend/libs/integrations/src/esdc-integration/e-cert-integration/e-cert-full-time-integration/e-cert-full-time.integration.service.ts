import { Injectable } from "@nestjs/common";
import {
  RecordTypeCodes,
  ECertRecord,
} from "../models/e-cert-integration-model";
import { ECertFullTimeFileHeader } from "./e-cert-files/e-cert-file-header";
import { ECertFullTimeFileFooter } from "./e-cert-files/e-cert-file-footer";
import { ECertFullTimeFileRecord } from "./e-cert-files/e-cert-file-record";
import { DisbursementValueType, OfferingIntensity } from "@sims/sims-db";
import { ECertIntegrationService } from "../e-cert.integration.service";
import { ECertResponseRecord } from "../e-cert-files/e-cert-response-record";
import { ConfigService } from "@sims/utilities/config";
import { FixedFormatFileLine } from "@sims/integrations/services/ssh";
import { SshService } from "@sims/integrations/services";
import {
  combineDecimalPlaces,
  getDisbursementValuesByType,
  getTotalDisbursementEffectiveAmount,
  getGenderCode,
  getMaritalStatusCode,
  getTotalYearsOfStudy,
  getPPDFlag,
  getFormattedPostalCode,
} from "@sims/utilities";

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
    super(config.zoneBSFTP, sshService);
  }

  /**
   * Create the e-Cert file content, by populating the header, detail and trailer records.
   * @param ecertRecords data needed to generate the e-Cert file.
   * @param fileSequence file sequence.
   * @returns complete e-Cert content to be sent.
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
      const disbursementAmount = getTotalDisbursementEffectiveAmount(
        ecertRecord.awards,
        [
          DisbursementValueType.CanadaLoan,
          DisbursementValueType.BCLoan,
          DisbursementValueType.CanadaGrant,
          DisbursementValueType.BCTotalGrant,
        ],
      );
      // ! All awards effective values are rounded to the nearest integer (0.5 rounds up).
      // ! studentAmount and schoolAmount have the decimal part combined into the integer part because
      // ! the schoolAmount contains decimals and schoolAmount is used to determine the studentAmount.
      const studentAmount = disbursementAmount - ecertRecord.schoolAmount;

      const cslAwardAmount = getTotalDisbursementEffectiveAmount(
        ecertRecord.awards,
        [DisbursementValueType.CanadaLoan],
      );
      const bcslAwardAmount = getTotalDisbursementEffectiveAmount(
        ecertRecord.awards,
        [DisbursementValueType.BCLoan],
      );
      const totalGrantAmount = getTotalDisbursementEffectiveAmount(
        ecertRecord.awards,
        [DisbursementValueType.CanadaGrant, DisbursementValueType.BCTotalGrant],
      );

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
      record.postalCode = getFormattedPostalCode(
        ecertRecord.country,
        ecertRecord.postalCode,
      );
      record.provinceState = ecertRecord.provinceState;
      record.gender = getGenderCode(ecertRecord.gender);
      record.maritalStatus = getMaritalStatusCode(ecertRecord.maritalStatus);
      record.studentNumber = ecertRecord.studentNumber;
      record.ppdFlag = getPPDFlag(ecertRecord.calculatedPDPPDStatus);
      record.totalGrantAmount = totalGrantAmount;
      // List of grants to be sent ignoring grants with 0 dollar amount.
      record.grantAwards = getDisbursementValuesByType(ecertRecord.awards, [
        DisbursementValueType.CanadaGrant,
        DisbursementValueType.BCTotalGrant,
      ]).filter((grantAward) => +grantAward.effectiveAmount > 0);

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
