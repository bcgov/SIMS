import { Injectable } from "@nestjs/common";
import { ConfigService, SshService } from "../../../services";
import {
  getDisbursementAmountByValueCode,
  getGenderCode,
  getPartTimeMaritalStatusCode,
  getTotalDisbursementAmount,
  round,
} from "../../../utilities";
import {
  RecordTypeCodes,
  CSGD,
  CSGP,
  CSGPT,
} from "./models/e-cert-part-time-integration.model";
import { FixedFormatFileLine } from "../../../services/ssh/sftp-integration-base.models";
import { ECertPartTimeFileHeader } from "./e-cert-files/e-cert-file-header";
import { ECertPartTimeFileFooter } from "./e-cert-files/e-cert-file-footer";
import { ECertPartTimeFileRecord } from "./e-cert-files/e-cert-file-record";
import { DisbursementValueType } from "../../../database/entities";
import { Award, ECertRecord } from "../e-cert-integration-model";
import { ECertIntegrationService } from "../e-cert-integration.service";

/**
 * Manages the file content generation and methods to
 * upload/download the files to SFTP.
 */
@Injectable()
export class ECertPartTimeIntegrationService extends ECertIntegrationService<void> {
  constructor(config: ConfigService, sshService: SshService) {
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
    const header = new ECertPartTimeFileHeader();
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

      const totalCSGPPTAmount = getDisbursementAmountByValueCode(
        roundedAwards,
        CSGD,
      );
      const totalCSGPPDAmount = getDisbursementAmountByValueCode(
        roundedAwards,
        CSGP,
      );
      const totalCSGPPTDEPAmount = getDisbursementAmountByValueCode(
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

      const record = new ECertPartTimeFileRecord();
      record.recordType = RecordTypeCodes.ECertRecord;
      record.sin = ecertRecord.sin;
      record.courseLoad = ecertRecord.courseLoad;
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
      record.maritalStatus = getPartTimeMaritalStatusCode(
        ecertRecord.maritalStatus,
      );
      record.studentNumber = ecertRecord.studentNumber;
      record.totalGrantAmount = totalGrantAmount;
      record.totalBCSGAmount = totalBCSGAmount;
      record.totalCSGPPTAmount = totalCSGPPTAmount;
      record.totalCSGPPDAmount = totalCSGPPDAmount;
      record.totalCSGPPTDEPAmount = totalCSGPPTDEPAmount;
      return record;
    });
    fileLines.push(...fileRecords);

    // Footer or Trailer record

    // Total disbursementAmount disbursed in the disbursement file.
    const totalAmountDisbursed = fileRecords.reduce(
      (hash, record) => hash + +record.disbursementAmount,
      0,
    );
    const footer = new ECertPartTimeFileFooter();
    footer.recordTypeCode = RecordTypeCodes.ECertFooter;
    footer.totalAmountDisbursed = totalAmountDisbursed;
    footer.recordCount = fileRecords.length;
    fileLines.push(footer);

    return fileLines;
  }
}
