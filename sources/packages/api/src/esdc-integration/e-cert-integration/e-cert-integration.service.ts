import { Injectable } from "@nestjs/common";
import { FixedFormatFileLine } from "../../services/ssh/sftp-integration-base.models";
import { SFTPIntegrationBase } from "../../services/ssh/sftp-integration-base";
import { ECertFileFooter } from "./e-cert-files/e-cert-file-footer";
import { ECertFileHeader } from "./e-cert-files/e-cert-file-header";
import { ECertResponseRecord } from "./e-cert-files/e-cert-response-record";
import { Award, ECertRecord } from "./models/e-cert-integration-model";
import {
  DisbursementSchedule,
  OfferingIntensity,
} from "../../database/entities";
import { ECertPartTimeResponseRecord } from "./e-cert-part-time-integration/e-cert-files/e-cert-response-record";
import { ECertFullTimeResponseRecord } from "./e-cert-full-time-integration/e-cert-files/e-cert-response-record";
import { getFieldOfStudyFromCIPCode } from "../../utilities";

@Injectable()
export abstract class ECertIntegrationService extends SFTPIntegrationBase<
  ECertResponseRecord[]
> {
  /**
   * This method will be implemented in the extended class and is used to create the ECert request content.
   * @param ecertRecords
   * @param fileSequence
   */
  abstract createRequestContent(
    ecertRecords: ECertRecord[],
    fileSequence?: number,
  ): FixedFormatFileLine[];

  /**
   * Transform the text lines in parsed objects specific to the integration process.
   * @param remoteFilePath full remote file path with file name.
   * @param eCertFileHeader
   * @param eCertFileFooter
   * @param offeringIntensity Offering Intensity of the ECert file processed.
   * @returns Parsed records from the file.
   */
  async downloadECertResponseFile(
    remoteFilePath: string,
    eCertFileHeader: ECertFileHeader,
    eCertFileFooter: ECertFileFooter,
    offeringIntensity: OfferingIntensity,
  ): Promise<ECertResponseRecord[]> {
    const fileLines = await this.downloadResponseFileLines(remoteFilePath);
    /**
     * Read the first line to check if the header code is the expected one.
     * and remove header.
     */
    const header = eCertFileHeader.createFromLine(fileLines.shift());
    if (
      header.recordTypeCode !== eCertFileHeader.getFeedbackHeaderRecordType()
    ) {
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
    const trailer = eCertFileFooter.createFromLine(fileLines.pop());
    if (
      trailer.recordTypeCode !== eCertFileFooter.getFeedbackFooterRecordType()
    ) {
      this.logger.error(
        `The E-Cert file ${remoteFilePath} has an invalid record type code on trailer: ${trailer.recordTypeCode}`,
      );
      // If the trailer is not the expected one.
      throw new Error(
        "The E-Cert file has an invalid record type code on trailer",
      );
    }

    /**
     * Check if the number of records match the trailer record count.
     * Here total record count is the total records rejected.
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
      let eCertRecord: ECertResponseRecord;
      if (offeringIntensity === OfferingIntensity.fullTime) {
        eCertRecord = new ECertFullTimeResponseRecord(line, lineNumber);
      }
      if (offeringIntensity === OfferingIntensity.partTime) {
        eCertRecord = new ECertPartTimeResponseRecord(line, lineNumber);
      }
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

  /**
   * Create the e-Cert record with the information needed to generate the
   * entire record to be sent to ESDC.
   * @param disbursement disbursement that contains all information to
   * generate the record.
   * @returns e-Cert record.
   */
  createECertRecord(disbursement: DisbursementSchedule): ECertRecord {
    const now = new Date();
    const application = disbursement.studentAssessment.application;
    const addressInfo = application.student.contactInfo.address;
    const offering = application.currentAssessment.offering;
    const fieldOfStudy = getFieldOfStudyFromCIPCode(
      offering.educationProgram.cipCode,
    );
    const awards = disbursement.disbursementValues.map(
      (disbursementValue) =>
        ({
          valueType: disbursementValue.valueType,
          valueCode: disbursementValue.valueCode,
          valueAmount: disbursementValue.valueAmount,
        } as Award),
    );

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
