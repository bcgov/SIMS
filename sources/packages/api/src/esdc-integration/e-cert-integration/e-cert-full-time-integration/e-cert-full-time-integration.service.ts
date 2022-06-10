import { Injectable } from "@nestjs/common";
import { ConfigService, SshService } from "../../../services";
import {
  combineDecimalPlaces,
  getDisbursementValuesByType,
  getFieldOfStudyFromCIPCode,
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
import { ECertDisbursementSchedule } from "../../../services/disbursement-schedule-service/disbursement-schedule.models";

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
      record.postalCode = ecertRecord.postalCode;
      record.provinceState = ecertRecord.provinceState;
      record.gender = getGenderCode(ecertRecord.gender);
      record.maritalStatus = getMaritalStatusCode(ecertRecord.maritalStatus);
      record.studentNumber = ecertRecord.studentNumber;
      record.totalGrantAmount = totalGrantAmount;
      // List of grants to be sent ignoring grants with 0 dollar amount.
      record.grantAwards = getDisbursementValuesByType(roundedAwards, [
        DisbursementValueType.CanadaGrant,
        DisbursementValueType.BCTotalGrant,
      ]).filter((grantAward) => +grantAward.valueAmount > 0);

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

  /**
   * Create the Full-Time e-Cert record with the information needed to generate the
   * entire record to be sent to ESDC.
   * @param disbursement disbursement that contains all information to
   * generate the record.
   * @returns e-Cert record.
   */
  createECertRecord(disbursement: ECertDisbursementSchedule): ECertRecord {
    const now = new Date();
    const application = disbursement.studentAssessment.application;
    const addressInfo = application.student.contactInfo.address;
    const offering = application.currentAssessment.offering;
    const fieldOfStudy = getFieldOfStudyFromCIPCode(
      offering.educationProgram.cipCode,
    );
    const awards = [];
    disbursement.disbursementValues.forEach((disbursementValue) => {
      if (disbursement.stopFullTimeBCFunding) {
        if (disbursementValue.valueType === DisbursementValueType.BCLoan) {
          disbursementValue.valueAmount = "0";
        }
        if (disbursementValue.valueType !== DisbursementValueType.BCGrant) {
          awards.push({
            valueType: disbursementValue.valueType,
            valueCode: disbursementValue.valueCode,
            valueAmount: disbursementValue.valueAmount,
          } as Award);
        }
      }
    });

    return {
      sin: application.student.sin,
      courseLoad: offering.courseLoad,
      applicationNumber: application.applicationNumber,
      documentNumber: disbursement.documentNumber,
      disbursementDate: disbursement.disbursementDate,
      documentProducedDate: now,
      negotiatedExpiryDate: disbursement.negotiatedExpiryDate,
      schoolAmount: disbursement.tuitionRemittanceRequestedAmount,
      educationalStartDate: offering.studyStartDate,
      educationalEndDate: offering.studyEndDate,
      federalInstitutionCode: offering.institutionLocation.institutionCode,
      weeksOfStudy: application.currentAssessment.assessmentData.weeks,
      fieldOfStudy,
      yearOfStudy: offering.yearOfStudy,
      completionYears: offering.educationProgram.completionYears,
      enrollmentConfirmationDate: disbursement.coeUpdatedAt,
      dateOfBirth: application.student.birthDate,
      lastName: application.student.user.lastName,
      firstName: application.student.user.firstName,
      addressLine1: addressInfo.addressLine1,
      addressLine2: addressInfo.addressLine2,
      city: addressInfo.city,
      country: addressInfo.country,
      provinceState: addressInfo.provinceState,
      postalCode: addressInfo.postalCode,
      email: application.student.user.email,
      gender: application.student.gender,
      maritalStatus: application.relationshipStatus,
      studentNumber: application.studentNumber,
      awards,
    } as ECertRecord;
  }
}
