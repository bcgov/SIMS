import { Injectable } from "@nestjs/common";
import {
  ConfigService,
  SequenceControlService,
  SshService,
} from "../../services";
import { ESDCIntegrationConfig } from "../../types";
import {
  getDayOfTheYear,
  getDisbursementValuesByType,
  getGenderCode,
  getMaritalStatusCode,
  getTotalDisbursementAmount,
  getTotalYearsOfStudy,
} from "../../utilities";
import {
  ECertRecord,
  RecordTypeCodes,
} from "./models/e-cert-full-time-integration.model";
import { StringBuilder } from "../../utilities/string-builder";
import { EntityManager } from "typeorm";
import { SFTPIntegrationBase } from "../../services/ssh/sftp-integration-base";
import { FixedFormatFileLine } from "../../services/ssh/sftp-integration-base.models";
import { ECertFileHeader } from "./e-cert-files/e-cert-file-header";
import { ECertFileFooter } from "./e-cert-files/e-cert-file-footer";
import { ECertfileRecord } from "./e-cert-files/e-cert-file-record";
import { DisbursementValueType } from "src/database/entities";

@Injectable()
export class ECertFullTimeIntegrationService extends SFTPIntegrationBase<void> {
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
   * @param totalSINHash sum hash total of the Student's SIN.
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
    header.originatorCode = this.esdcConfig.originatorCode;
    header.sequence = fileSequence;
    fileLines.push(header);

    // Detail records

    // Calculated values.
    // !All values must be rounded to the nearest integer (0.5 rounds up).
    const fileRecords = ecertRecords.map((ecertRecord) => {
      const studentAmount = getTotalDisbursementAmount(ecertRecord.awards, [
        DisbursementValueType.CanadaLoan,
        DisbursementValueType.BCLoan,
        DisbursementValueType.CanadaGrant,
        DisbursementValueType.BCTotalGrant,
      ]);
      const cslAwardAmount = getTotalDisbursementAmount(ecertRecord.awards, [
        DisbursementValueType.CanadaLoan,
      ]);
      const bcslAwardAmount = getTotalDisbursementAmount(ecertRecord.awards, [
        DisbursementValueType.BCLoan,
      ]);
      const totalGrantAmount = getTotalDisbursementAmount(ecertRecord.awards, [
        DisbursementValueType.CanadaGrant,
        DisbursementValueType.BCTotalGrant,
      ]);
      const schoolAmount = Math.round(ecertRecord.schoolAmount);
      // These values are already rounded.
      const disbursementAmount = studentAmount + schoolAmount;

      const esdcRecord = new ECertfileRecord();
      esdcRecord.recordType = RecordTypeCodes.ECertRecord;
      esdcRecord.sin = ecertRecord.sin;
      esdcRecord.applicationNumber = ecertRecord.applicationNumber;
      esdcRecord.documentNumber = ecertRecord.documentNumber;
      esdcRecord.disbursementDate = ecertRecord.disbursementDate;
      esdcRecord.documentProducedDate = ecertRecord.documentProducedDate;
      esdcRecord.negotiatedExpiryDate = ecertRecord.negotiatedExpiryDate;
      esdcRecord.disbursementAmount = disbursementAmount;
      esdcRecord.studentAmount = studentAmount;
      esdcRecord.schoolAmount = schoolAmount;
      esdcRecord.cslAwardAmount = cslAwardAmount;
      esdcRecord.bcslAwardAmount = bcslAwardAmount;
      esdcRecord.educationalStartDate = ecertRecord.educationalStartDate;
      esdcRecord.educationalEndDate = ecertRecord.educationalEndDate;
      esdcRecord.federalInstitutionCode = ecertRecord.federalInstitutionCode;
      esdcRecord.weeksOfStudy = ecertRecord.weeksOfStudy;
      esdcRecord.fieldOfStudy = ecertRecord.fieldOfStudy;
      esdcRecord.yearOfStudy = ecertRecord.yearOfStudy;
      esdcRecord.totalYearsOfStudy = getTotalYearsOfStudy(
        ecertRecord.completionYears,
      );
      esdcRecord.enrollmentConfirmationDate =
        ecertRecord.enrollmentConfirmationDate;
      esdcRecord.dateOfBirth = ecertRecord.dateOfBirth;
      esdcRecord.lastName = ecertRecord.lastName;
      esdcRecord.firstName = ecertRecord.firstName;
      esdcRecord.addressLine1 = ecertRecord.addressLine1;
      esdcRecord.addressLine2 = ecertRecord.addressLine2;
      esdcRecord.city = ecertRecord.city;
      esdcRecord.countryName = ecertRecord.country;
      esdcRecord.emailAddress = ecertRecord.email;
      esdcRecord.gender = getGenderCode(ecertRecord.gender);
      esdcRecord.maritalStatus = getMaritalStatusCode(
        ecertRecord.maritalStatus,
      );
      esdcRecord.studentNumber = ecertRecord.studentNumber;
      esdcRecord.totalGrantAmount = totalGrantAmount;
      esdcRecord.grantAwards = getDisbursementValuesByType(ecertRecord.awards, [
        DisbursementValueType.CanadaGrant,
        DisbursementValueType.BCTotalGrant,
      ]);

      console.log(esdcRecord);

      return esdcRecord;
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

  async createRequestFileName(entityManager?: EntityManager): Promise<{
    fileName: string;
    filePath: string;
  }> {
    const fileNameArray = new StringBuilder();
    const now = new Date();
    const dayOfTheYear = getDayOfTheYear(now).toString().padStart(3, "0");
    fileNameArray.append(
      `PP${
        this.esdcConfig.originatorCode
      }.EDU.ECERTS.${now.getFullYear()}${dayOfTheYear}`,
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
    fileNameArray.appendWithStartFiller(fileNameSequence.toString(), 3, "0");
    fileNameArray.append(".DAT");
    const fileName = fileNameArray.toString();
    const filePath = `${this.esdcConfig.ftpRequestFolder}\\${fileName}`;
    return {
      fileName,
      filePath,
    };
  }

  async downloadResponseFile(fileName: string): Promise<void> {
    throw new Error("Full Time Entitlement Feedback File to be implemented.");
  }
}
