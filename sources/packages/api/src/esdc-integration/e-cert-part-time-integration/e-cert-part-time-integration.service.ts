import { Injectable } from "@nestjs/common";
import {
  ConfigService,
  SequenceControlService,
  SshService,
} from "../../services";
import { ESDCIntegrationConfig } from "../../types";
import {
  getDayOfTheYear,
  getDisbursementAmountByValueCode,
  getGenderCode,
  getPTMaritalStatusCode,
  getTotalDisbursementAmount,
  round,
} from "../../utilities";
import {
  Award,
  ECertRecord,
  RecordTypeCodes,
  CSGD,
  CSGP,
  CSGPT,
} from "./models/e-cert-part-time-integration.model";
import {
  NUMBER_FILLER,
  CreateRequestFileNameResult,
} from "../models/esdc-integration.model";
import { StringBuilder } from "../../utilities/string-builder";
import { EntityManager } from "typeorm";
import { SFTPIntegrationBase } from "../../services/ssh/sftp-integration-base";
import { FixedFormatFileLine } from "../../services/ssh/sftp-integration-base.models";
import { ECertFileHeader } from "./e-cert-files/e-cert-file-header";
import { ECertFileFooter } from "./e-cert-files/e-cert-file-footer";
import { ECertFileRecord } from "./e-cert-files/e-cert-file-record";
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
    ecertRecords: ECertRecord[],
    fileSequence: number,
  ): FixedFormatFileLine[] {
    const fileLines: FixedFormatFileLine[] = [];
    // Header record
    const header = new ECertFileHeader();
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

      const record = new ECertFileRecord();
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
    const footer = new ECertFileFooter();
    footer.recordTypeCode = RecordTypeCodes.ECertFooter;
    footer.totalAmountDisbursed = totalAmountDisbursed;
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
   * @returns fileName and part remote file path that the file must be uploaded.
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
      }PBC.EDU.PTCERTS.D${now.getFullYear()}${dayOfTheYear}`,
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
   * This method will be implemented during the response processing of the PartTime - Ecert file
   * @param remoteFilePath
   */
  downloadResponseFile(remoteFilePath: string): Promise<void> {
    throw new Error(`Method not implemented , ${remoteFilePath} not declared`);
  }
}
