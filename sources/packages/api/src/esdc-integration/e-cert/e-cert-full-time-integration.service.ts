import { Injectable } from "@nestjs/common";
import {
  ConfigService,
  SequenceControlService,
  SshService,
} from "../../services";
import { ESDCIntegrationConfig } from "../../types";
import {
  getDayOfTheYear,
  getGenderCode,
  getMaritalStatusCode,
} from "../../utilities";
import {
  ECertRecord,
  RecordTypeCodes,
} from "./models/e-cert-integration.model";
import { StringBuilder } from "../../utilities/string-builder";
import { EntityManager } from "typeorm";
import { SFTPIntegrationBase } from "../../services/ssh/sftp-integration-base";
import { FixedFormatFileLine } from "../../services/ssh/sftp-integration-base.models";
import { ECertFileHeader } from "./e-cert-files/e-cert-file-header";
import { ECertFileFooter } from "./e-cert-files/e-cert-file-footer";
import { ECertfileRecord } from "./e-cert-files/e-cert-file-record";

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
    totalSINHash: number,
  ): FixedFormatFileLine[] {
    const fileLines: FixedFormatFileLine[] = [];
    // Header record
    const header = new ECertFileHeader();
    header.recordTypeCode = RecordTypeCodes.ECertHeader;
    header.provinceCode = this.esdcConfig.originatorCode;
    header.sequence = fileSequence;
    fileLines.push(header);
    // Detail records
    const fileRecords = ecertRecords.map((ecertRecord) => {
      const esdcRecord = new ECertfileRecord();
      esdcRecord.recordType = RecordTypeCodes.ECertRecord;
      esdcRecord.sin = ecertRecord.sin;
      esdcRecord.applicationNumber = ecertRecord.applicationNumber;
      esdcRecord.documentNumber = ecertRecord.documentNumber;
      esdcRecord.disbursementDate = ecertRecord.disbursementDate;
      esdcRecord.documentProducedDate = ecertRecord.documentProducedDate;
      esdcRecord.negotiatedExpiryDate = ecertRecord.negotiatedExpiryDate;
      esdcRecord.disbursementAmount = ecertRecord.disbursementAmount;
      esdcRecord.studentAmount = ecertRecord.studentAmount;
      esdcRecord.schoolAmount = ecertRecord.schoolAmount;
      esdcRecord.cslAwardAmount = ecertRecord.cslAwardAmount;
      esdcRecord.bcslAwardAmount = ecertRecord.bcslAwardAmount;
      esdcRecord.educationalStartDate = ecertRecord.educationalStartDate;
      esdcRecord.educationalEndDate = ecertRecord.educationalEndDate;
      esdcRecord.federalInstitutionCode = ecertRecord.federalInstitutionCode;
      esdcRecord.weeksOfStudy = ecertRecord.weeksOfStudy;
      esdcRecord.fieldOfStudy = ecertRecord.fieldOfStudy;
      esdcRecord.yearOfStudy = ecertRecord.yearOfStudy;
      esdcRecord.totalYearsOfStudy = ecertRecord.totalYearsOfStudy;
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
      esdcRecord.totalGrantAmount = ecertRecord.totalGrantAmount;
      esdcRecord.grantAwards = ecertRecord.grantAwards;
      return esdcRecord;
    });
    fileLines.push(...fileRecords);
    // Footer or Trailer record
    const footer = new ECertFileFooter();
    footer.recordTypeCode = RecordTypeCodes.ECertFooter;
    footer.totalSINHash = totalSINHash;
    footer.recordCount = fileRecords.length;
    fileLines.push(footer);

    return fileLines;
  }

  /**
   * Expected file name of the MSFAA request file.
   * for Part time the format is PPxx.EDU.MSFA.SENT.PT.YYYYMMDD.sss
   * for full time the format is PPxx.EDU.MSFA.SENT.YYYYMMDD.sss
   * xx is the province code currently its BC
   * sss is a sequence that should be resetted every day
   * @param OfferingIntensity offering intensity of the application
   *  where MSFAA is requested.
   * @returns Full file path of the file to be saved on the SFTP.
   */
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
