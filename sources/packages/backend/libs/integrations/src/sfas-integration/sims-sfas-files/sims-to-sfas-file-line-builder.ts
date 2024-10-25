import { StudentDetail } from "@sims/integrations/services/sfas";
import { FixedFormatFileLine } from "@sims/integrations/services/ssh";
import { SIMSToSFASRecordTypeCodes } from "../sfas-integration.models";
import { SIMSToSFASHeader } from "./sims-to-sfas-header";
import { SIMSToSFASStudentRecord } from "./sims-to-sfas-student-record";
import { DisabilityStatus } from "@sims/sims-db";
import { YNFlag } from "@sims/integrations/models";
import { SIMSToSFASFooter } from "./sims-to-sfas.footer";
import { combineDecimalPlaces } from "@sims/utilities";
import { SIMSToSFASBaseRecord } from "./sims-to-sfas-base.record";

export class SIMSToSFASFileLineBuilder {
  /**
   * Fixed length file line data of SIMS to SFAS.
   */
  private readonly fileLinesInternal: SIMSToSFASBaseRecord[] = [];

  /**
   * Append the header record.
   * @param bridgeFileDate date when the bridge file data was extracted.
   * @returns instance of the class for further appending.
   */
  appendHeader(bridgeFileDate: Date): this {
    const header = new SIMSToSFASHeader();
    header.recordTypeCode = SIMSToSFASRecordTypeCodes.Header;
    header.originator = "PSFS";
    header.title = "SIMS to SFAS BRIDGE";
    header.creationDate = bridgeFileDate;
    this.fileLinesInternal.push(header);
    return this;
  }

  /**
   * Append the footer record.
   * @returns instance of the class for further appending.
   */
  appendFooter(): this {
    const footer = new SIMSToSFASFooter();
    footer.recordTypeCode = SIMSToSFASRecordTypeCodes.Footer;
    footer.totalRecordsCount = this.totalDataRecords;
    this.fileLinesInternal.push(footer);
    return this;
  }

  /**
   * Append student file records after transforming them.
   * @param studentRecords student records.
   * @returns instance of the class for further appending.
   */
  appendStudentFileRecords(studentRecords: StudentDetail[]): this {
    studentRecords.forEach((studentDetail) => {
      const studentFileRecord = new SIMSToSFASStudentRecord();
      studentFileRecord.recordTypeCode =
        SIMSToSFASRecordTypeCodes.StudentDataRecord;
      studentFileRecord.studentId = studentDetail.id;
      studentFileRecord.givenName = studentDetail.user.firstName;
      studentFileRecord.lastName = studentDetail.user.lastName;
      studentFileRecord.birthDate = new Date(studentDetail.birthDate);
      studentFileRecord.sin = studentDetail.sinValidation.sin;
      studentFileRecord.pdStatusFlag =
        studentDetail.disabilityStatus === DisabilityStatus.PD
          ? YNFlag.Y
          : YNFlag.N;
      studentFileRecord.pdStatusEffectiveDate =
        studentDetail.disabilityStatus === DisabilityStatus.PD
          ? studentDetail.disabilityStatusEffectiveDate
          : null;
      studentFileRecord.ppdStatusFlag =
        studentDetail.disabilityStatus === DisabilityStatus.PPD
          ? YNFlag.Y
          : YNFlag.N;
      studentFileRecord.ppdStatusEffectiveDate =
        studentDetail.disabilityStatus === DisabilityStatus.PPD
          ? studentDetail.disabilityStatusEffectiveDate
          : null;
      studentFileRecord.casSupplierNumber =
        studentDetail.casSupplier?.supplierNumber;
      studentFileRecord.casSiteNumber =
        studentDetail.casSupplier?.supplierAddress?.supplierSiteCode;
      studentFileRecord.fullTimeCSLOveraward = studentDetail.cslfOverawardTotal
        ? combineDecimalPlaces(+studentDetail.cslfOverawardTotal)
        : 0;
      studentFileRecord.fullTimeBCSLOveraward = studentDetail.bcslOverawardTotal
        ? combineDecimalPlaces(+studentDetail.bcslOverawardTotal)
        : 0;
      this.fileLinesInternal.push(studentFileRecord);
    });
    return this;
  }
  // TODO: SIMS to SFAS - Create append methods for applications, restrictions and footer.

  get fileLines(): FixedFormatFileLine[] {
    return this.fileLinesInternal;
  }

  /**
   * Get total number of data records in the file.
   * Data record is any record other than header and footer.
   */
  get totalDataRecords(): number {
    return this.fileLinesInternal.filter(
      (fileLine) =>
        fileLine.recordTypeCode !== SIMSToSFASRecordTypeCodes.Header &&
        fileLine.recordTypeCode !== SIMSToSFASRecordTypeCodes.Footer,
    ).length;
  }
}
