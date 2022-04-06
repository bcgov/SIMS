import { Injectable } from "@nestjs/common";
import {
  ConfigService,
  SequenceControlService,
  SshService,
} from "../../services";
import { ESDCIntegrationConfig } from "../../types";
import {
  getDisbursementAmountByValueCode,
  getGenderCode,
  getPTMaritalStatusCode,
  getTotalDisbursementAmount,
  round,
} from "../../utilities";
import {
  Award,
  ECertPTRecord,
  RecordTypeCodes,
  CSGD,
  CSGP,
  CSGPT,
} from "./models/e-cert-part-time-integration.model";
import { SFTPIntegrationBase } from "../../services/ssh/sftp-integration-base";
import { FixedFormatFileLine } from "../../services/ssh/sftp-integration-base.models";
import { ECertPTFileHeader } from "./e-cert-files/e-cert-file-header";
import { ECertPTFileFooter } from "./e-cert-files/e-cert-file-footer";
import { ECertPTFileRecord } from "./e-cert-files/e-cert-file-record";
import { DisbursementValueType } from "../../database/entities";

/**
 * Manages the file content generation and methods to
 * upload/download the files to SFTP.
 */
@Injectable()
export class ECertPartTimeIntegrationService extends SFTPIntegrationBase<void> {
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
    ecertRecords: ECertPTRecord[],
    fileSequence: number,
  ): FixedFormatFileLine[] {
    const fileLines: FixedFormatFileLine[] = [];
    // Header record
    const header = new ECertPTFileHeader();
    header.recordTypeCode = RecordTypeCodes.ECertHeader;
    header.processDate = new Date();
    fileLines.push(header);

    // Detail records
    // Calculated values
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

      const totalCSGP_PTAmount = getDisbursementAmountByValueCode(
        roundedAwards,
        CSGD,
      );
      const totalCSGP_PDAmount = getDisbursementAmountByValueCode(
        roundedAwards,
        CSGP,
      );
      const totalCSGP_PTDEPAmount = getDisbursementAmountByValueCode(
        roundedAwards,
        CSGPT,
      );

      const disbursementAmount = getTotalDisbursementAmount(roundedAwards, [
        DisbursementValueType.CanadaLoan,
      ]);
      const totalGrantAmount = getTotalDisbursementAmount(roundedAwards, [
        DisbursementValueType.CanadaGrant,
        DisbursementValueType.BCTotalGrant,
      ]);
      const totalBCSGAmount = getTotalDisbursementAmount(roundedAwards, [
        DisbursementValueType.BCTotalGrant,
      ]);

      const record = new ECertPTFileRecord();
      record.recordType = RecordTypeCodes.ECertRecord;
      record.sin = ecertRecord.sin;
      record.certNumber = fileSequence;
      record.disbursementDate = ecertRecord.disbursementDate;
      record.documentProducedDate = ecertRecord.documentProducedDate;
      record.disbursementAmount = disbursementAmount;
      record.educationalStartDate = ecertRecord.educationalStartDate;
      record.educationalEndDate = ecertRecord.educationalEndDate;
      record.federalInstitutionCode = ecertRecord.federalInstitutionCode;
      record.weeksOfStudy = ecertRecord.weeksOfStudy;
      record.fieldOfStudy = ecertRecord.fieldOfStudy;
      record.yearOfStudy = ecertRecord.yearOfStudy;
      record.enrollmentConfirmationDate =
        ecertRecord.enrollmentConfirmationDate;
      record.dateOfBirth = ecertRecord.dateOfBirth;
      record.lastName = ecertRecord.lastName;
      record.firstName = ecertRecord.firstName;
      record.addressLine1 = ecertRecord.addressLine1;
      record.addressLine2 = ecertRecord.addressLine2;
      record.city = ecertRecord.city;
      record.emailAddress = ecertRecord.email;
      record.gender = getGenderCode(ecertRecord.gender);
      record.maritalStatus = getPTMaritalStatusCode(ecertRecord.maritalStatus);
      record.studentNumber = ecertRecord.studentNumber;
      record.totalGrantAmount = totalGrantAmount;
      record.totalBCSGAmount = totalBCSGAmount;
      record.totalCSGP_PTAmount = totalCSGP_PTAmount;
      record.totalCSGP_PDAmount = totalCSGP_PDAmount;
      record.totalCSGP_PTDEPAmount = totalCSGP_PTDEPAmount;
      return record;
    });
    fileLines.push(...fileRecords);

    // Footer or Trailer record

    // Total disbursementAmount disbursed in the disbursement file.
    const totalAmountDisbursed = fileRecords.reduce(
      (hash, record) => hash + +record.disbursementAmount,
      0,
    );
    const footer = new ECertPTFileFooter();
    footer.recordTypeCode = RecordTypeCodes.ECertFooter;
    footer.totalAmountDisbursed = totalAmountDisbursed;
    footer.recordCount = fileRecords.length;
    fileLines.push(footer);

    return fileLines;
  }

  /**
   * This method will be implemented during the response processing of the PartTime - Ecert file
   * @param remoteFilePath
   */
  downloadResponseFile(remoteFilePath: string): Promise<void> {
    throw new Error(`Method not implemented , ${remoteFilePath} not declared`);
  }
}
