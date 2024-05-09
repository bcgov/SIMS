import { Injectable } from "@nestjs/common";
import {
  RecordTypeCodes,
  CSGD,
  CSGP,
  ECertRecord,
  CSPT,
} from "../models/e-cert-integration-model";
import { ECertPartTimeFileHeader } from "./e-cert-files/e-cert-file-header";
import { ECertPartTimeFileFooter } from "./e-cert-files/e-cert-file-footer";
import { ECertPartTimeFileRecord } from "./e-cert-files/e-cert-file-record";
import { DisbursementValueType, OfferingIntensity } from "@sims/sims-db";
import { ECertIntegrationService } from "../e-cert.integration.service";
import { ECertResponseRecord } from "../e-cert-files/e-cert-response-record";
import { ConfigService } from "@sims/utilities/config";
import { FixedFormatFileLine } from "@sims/integrations/services/ssh";
import { SshService } from "@sims/integrations/services";
import {
  combineDecimalPlaces,
  getCountryCode,
  getDisbursementEffectiveAmountByValueCode,
  getGenderCode,
  getPPDFlag,
  getPartTimeMaritalStatusCode,
  getTotalDisbursementEffectiveAmount,
} from "@sims/utilities";

/**
 * Manages the file content generation and methods to
 * upload/download the files to SFTP.
 */
@Injectable()
export class ECertPartTimeIntegrationService extends ECertIntegrationService {
  constructor(
    private readonly eCertPartTimeFileHeader: ECertPartTimeFileHeader,
    private readonly eCertPartTimeFileFooter: ECertPartTimeFileFooter,
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
    const header = new ECertPartTimeFileHeader();
    header.recordTypeCode = RecordTypeCodes.ECertPartTimeHeader;
    header.processDate = new Date();
    header.sequence = fileSequence;
    fileLines.push(header);

    // Detail records
    // Calculated values
    const fileRecords = ecertRecords.map((ecertRecord) => {
      const csgpPTAmount = getDisbursementEffectiveAmountByValueCode(
        ecertRecord.awards,
        CSPT,
      );
      const csgpPDAmount = getDisbursementEffectiveAmountByValueCode(
        ecertRecord.awards,
        CSGP,
      );
      const csgpPTDEPAmount = getDisbursementEffectiveAmountByValueCode(
        ecertRecord.awards,
        CSGD,
      );

      const disbursementAmount = getTotalDisbursementEffectiveAmount(
        ecertRecord.awards,
        [DisbursementValueType.CanadaLoan],
      );
      const totalCanadaAndProvincialGrantsAmount =
        getTotalDisbursementEffectiveAmount(ecertRecord.awards, [
          DisbursementValueType.CanadaGrant,
          DisbursementValueType.BCTotalGrant,
        ]);
      const totalBCGrantAmount = getTotalDisbursementEffectiveAmount(
        ecertRecord.awards,
        [DisbursementValueType.BCTotalGrant],
      );

      const record = new ECertPartTimeFileRecord();
      record.recordType = RecordTypeCodes.ECertPartTimeRecord;
      record.sin = ecertRecord.sin;
      record.courseLoad = ecertRecord.courseLoad;
      record.certNumber = ecertRecord.documentNumber;
      record.disbursementDate = ecertRecord.disbursementDate;
      record.documentProducedDate = ecertRecord.documentProducedDate;
      record.disbursementAmount = combineDecimalPlaces(disbursementAmount);
      record.schoolAmount = combineDecimalPlaces(ecertRecord.schoolAmount);
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
      record.country = getCountryCode(ecertRecord.country);
      record.provinceState = ecertRecord.provinceState;
      record.postalCode = ecertRecord.postalCode;
      record.emailAddress = ecertRecord.email;
      record.gender = getGenderCode(ecertRecord.gender);
      record.maritalStatus = getPartTimeMaritalStatusCode(
        ecertRecord.maritalStatus,
      );
      record.studentNumber = ecertRecord.studentNumber;
      record.ppdFlag = getPPDFlag(ecertRecord.calculatedPDPPDStatus);
      record.totalCanadaAndProvincialGrantsAmount =
        totalCanadaAndProvincialGrantsAmount;
      record.totalBCGrantAmount = totalBCGrantAmount;
      record.csgpPTAmount = csgpPTAmount;
      record.csgpPDAmount = csgpPDAmount;
      record.csgpPTDEPAmount = csgpPTDEPAmount;
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
    footer.recordTypeCode = RecordTypeCodes.ECertPartTimeFooter;
    footer.totalAmountDisbursed = totalAmountDisbursed;
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
      this.eCertPartTimeFileHeader,
      this.eCertPartTimeFileFooter,
      OfferingIntensity.partTime,
    );
  }
}
