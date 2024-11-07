import {
  ApplicationRecord,
  RestrictionRecord,
  StudentDetail,
} from "@sims/integrations/services/sfas";
import { SIMSToSFASRecordTypeCodes } from "../sfas-integration.models";
import { SIMSToSFASHeader } from "./sims-to-sfas-header";
import { SIMSToSFASStudentRecord } from "./sims-to-sfas-student-record";
import { DisabilityStatus, OfferingIntensity } from "@sims/sims-db";
import { YNFlag } from "@sims/integrations/models";
import { SIMSToSFASFooter } from "./sims-to-sfas.footer";
import { combineDecimalPlaces } from "@sims/utilities";
import { SIMSToSFASBaseRecord } from "./sims-to-sfas-base.record";
import { FixedFormatFileLine } from "@sims/integrations/services/ssh";

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
    footer.totalRecordsCount = this.getTotalDataRecords();
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

  /**
   * Append application file records after transforming them.
   * @param applicationRecords application records.
   * @returns instance of the class for further appending.
   */
  appendApplicationFileRecords(applicationRecords: ApplicationRecord[]): this {
    applicationRecords.forEach((applicationRecord) => {
      const applicationFileRecord = new SIMSToSFASStudentRecord();
      applicationFileRecord.recordTypeCode =
        applicationRecord.offeringIntensity === OfferingIntensity.fullTime
          ? SIMSToSFASRecordTypeCodes.FullTimeApplicationDataRecord
          : SIMSToSFASRecordTypeCodes.PartTimeApplicationDataRecord;
      applicationFileRecord.studentId = applicationRecord.studentId;
      applicationFileRecord.applicationNumber = applicationRecord.applicationId;
      applicationFileRecord.studyStartDate = applicationRecord.studyStartDate;
      applicationFileRecord.studyEndDate = applicationRecord.studyEndDate;
      applicationFileRecord.programYearId = applicationRecord.programYearId;
      applicationFileRecord.csgpAwardTotal = applicationRecord.csgpAwardTotal;
      applicationFileRecord.sbsdAwardTotal = applicationRecord.sbsdAwardTotal;
      applicationFileRecord.applicationCancelDate =
        applicationRecord.applicationCancelDate;
      this.fileLinesInternal.push(applicationFileRecord);
    });
    return this;
  }

  /**
   * Append restriction file records after transforming them.
   * @param restrictionRecords restriction records.
   * @returns instance of the class for further appending.
   */
  appendRestrictionFileRecords(restrictionRecords: RestrictionRecord[]): this {
    restrictionRecords.forEach((restrictionRecord) => {
      const restrictionFileRecord = new SIMSToSFASStudentRecord();
      restrictionFileRecord.recordTypeCode =
        SIMSToSFASRecordTypeCodes.RestrictionDataRecord;
      restrictionFileRecord.studentId = restrictionRecord.studentId;
      restrictionFileRecord.restrictionId = restrictionRecord.restrictionId;
      restrictionFileRecord.restrictionCode = restrictionRecord.restrictionCode;
      restrictionFileRecord.restrictionEffectiveDate =
        restrictionRecord.restrictionEffectiveDate;
      restrictionFileRecord.restrictionRemovalDate =
        restrictionRecord.restrictionRemovalDate;
      this.fileLinesInternal.push(restrictionFileRecord);
    });
    return this;
  }

  get fileLines(): FixedFormatFileLine[] {
    return this.fileLinesInternal;
  }

  /**
   * Get total number of data records in the file.
   * Data record is any record other than header and footer.
   * @returns total number of data records.
   */
  private getTotalDataRecords(): number {
    return this.fileLinesInternal.filter(
      (fileLine) =>
        fileLine.recordTypeCode !== SIMSToSFASRecordTypeCodes.Header &&
        fileLine.recordTypeCode !== SIMSToSFASRecordTypeCodes.Footer,
    ).length;
  }
}
