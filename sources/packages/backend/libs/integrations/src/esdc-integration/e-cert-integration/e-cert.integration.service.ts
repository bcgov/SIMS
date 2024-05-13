import { Injectable } from "@nestjs/common";
import { ECertFileFooter } from "./e-cert-files/e-cert-file-footer";
import { ECertFileHeader } from "./e-cert-files/e-cert-file-header";
import { ECertResponseRecord } from "./e-cert-files/e-cert-response-record";
import { ECertRecord } from "./models/e-cert-integration-model";
import { OfferingIntensity } from "@sims/sims-db";
import { ECertPartTimeResponseRecord } from "./e-cert-part-time-integration/e-cert-files/e-cert-response-record";
import { ECertFullTimeResponseRecord } from "./e-cert-full-time-integration/e-cert-files/e-cert-response-record";
import {
  FixedFormatFileLine,
  SFTPIntegrationBase,
} from "@sims/integrations/services/ssh";
import { CustomNamedError } from "@sims/utilities";
import { FILE_PARSING_ERROR } from "@sims/services/constants";

@Injectable()
export abstract class ECertIntegrationService extends SFTPIntegrationBase<
  ECertResponseRecord[]
> {
  /**
   * This method will be implemented in the extended class and is used to create the e-Cert request content.
   * @param ecertRecords data needed to generate the e-Cert file.
   * @param fileSequence file sequence.
   * @returns when overridden in a derived class, returns the complete e-Cert content to be sent.
   */
  abstract createRequestContent(
    ecertRecords: ECertRecord[],
    fileSequence: number,
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
      throw new CustomNamedError(
        "The E-Cert file has an invalid record type code on header.",
        FILE_PARSING_ERROR,
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
      throw new CustomNamedError(
        "The E-Cert file has an invalid record type code on trailer.",
        FILE_PARSING_ERROR,
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
      throw new CustomNamedError(
        "The E-Cert file has invalid number of records.",
        FILE_PARSING_ERROR,
      );
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
        `The E-Cert file ${remoteFilePath} has SINHash inconsistent with the total sum of sin in the records.`,
      );
      // If the Sum hash total of SIN in the records does not match the trailer SIN hash total count.
      throw new CustomNamedError(
        "The E-Cert file has TotalSINHash inconsistent with the total sum of sin in the records.",
        FILE_PARSING_ERROR,
      );
    }
    return feedbackRecords;
  }
}
