import { YNFlag } from "@sims/integrations/models";
import { SIMSToSFASBaseRecord } from "./sims-to-sfas-base.record";

/**
 * Student data record for SIMS to SFAS file.
 */
export class SIMSToSFASStudentRecord extends SIMSToSFASBaseRecord {
  /**
   * The unique key/number used in SIMS to identify this individual student.
   */
  studentId: number;
  /**
   * The given name as defined in SIMS.
   */
  givenName?: string;
  /**
   * The last name as defined in SIMS.
   */
  lastName: string;
  /**
   * Date of birth.
   */
  birthDate: Date;
  /**
   * Social Insurance Number for the student
   */
  sin: string;
  /**
   * Permanent Disability Flag.
   */
  pdStatusFlag: YNFlag;
  /**
   * The date when a PD status is effective.
   */
  pdStatusEffectiveDate?: Date;
  /**
   * Persistent or Prolonged Disability Flag
   */
  ppdStatusFlag: YNFlag;
  /**
   * The date when a PPD status is effective.
   */
  ppdStatusEffectiveDate?: Date;
  /**
   * The most recent, active Master Student Loan Agreement Number for full time.
   ** There is no requirement currently to map this field. It is populated with filler values.
   */
  fullTimeMSFAANumber?: number;
  /**
   * The most recent, active Master Student Loan Agreement signed date for full time.
   ** There is no requirement currently to map this field. It is populated with filler values.
   */
  fullTimeMSFAASignedDate?: Date;
  /**
   * The most recent, active Master Student Loan Agreement Number for part time.
   ** There is no requirement currently to map this field. It is populated with filler values.
   */
  partTimeMSFAANumber?: number;
  /**
   * The most recent, active Master Student Loan Agreement signed date for part time.
   ** There is no requirement currently to map this field. It is populated with filler values.
   */
  partTimeMSFAASignedDate?: Date;
  /**
   * Vendor/supplier number assigned to an individual student by CAS.
   */
  casSupplierNumber?: string;
  /**
   * Site number assigned to an individual student by CAS.
   */
  casSiteNumber?: string;
  /**
   * Canada Student Loan total overaward balance for full time.
   */
  fullTimeCSLOveraward?: number;
  /**
   * BC Student Loan total overaward balance.
   */
  fullTimeBCSLOveraward?: number;
  /**
   * BC Grant total overaward balance.
   ** There is no requirement currently to map this field. It is populated with filler values.
   */
  grantOveraward?: number;
  /**
   * The application number for the student.
   */
  applicationNumber: string;
  /**
   * The student's study start date.
   */
  studyStartDate: Date;
  /**
   * The student's study end date.
   */
  studyEndDate: Date;
  /**
   * The student's program year id.
   */
  programYearId: number;
  /**
   * The student's CSGP award total.
   */
  csgpAwardTotal: number;
  /**
   * The student's SBSD award total.
   */
  sbsdAwardTotal: number;
  /**
   * The application cancel date.
   */
  applicationCancelDate?: Date;
  /**
   * The student's restriction id.
   */
  restrictionId: number;
  /**
   * The student's restriction code.
   */
  restrictionCode: string;
  /**
   * The student's restriction effective date.
   */
  restrictionEffectiveDate: Date;
  /**
   * The student's restriction removal date.
   */
  restrictionRemovalDate?: Date;

  /**
   * Get the information as a fixed line format to be
   * added to the file uploaded to the SFTP.
   * @returns fixed line formatted.
   */
  getFixedFormat(): string {
    const record = this.getStringBuilder();
    record.append(this.recordTypeCode);
    record.appendNumberWithFiller(this.studentId, 10);
    record.appendOptionalStringWithFiller(this.givenName, 15);
    record.appendStringWithFiller(this.lastName, 25);
    record.appendFormattedDate(this.birthDate);
    record.append(this.sin);
    record.append(this.pdStatusFlag);
    record.appendOptionalFormattedDate(this.pdStatusEffectiveDate);
    record.append(this.ppdStatusFlag);
    record.appendOptionalFormattedDate(this.ppdStatusEffectiveDate);
    record.appendOptionalStringWithFiller(null, 10); // Full time MSFAA number is filled with blank spaces.
    record.appendOptionalFormattedDate(this.fullTimeMSFAASignedDate);
    record.appendOptionalStringWithFiller(null, 10); // Part time MSFAA number is filled with blank spaces.
    record.appendOptionalFormattedDate(this.partTimeMSFAASignedDate);
    record.appendOptionalStringWithFiller(this.casSupplierNumber, 7);
    record.appendOptionalStringWithFiller(this.casSiteNumber, 3);
    record.appendOptionalNumberWithFiller(this.fullTimeCSLOveraward, 10);
    record.appendOptionalNumberWithFiller(this.fullTimeBCSLOveraward, 10);
    record.appendOptionalNumberWithFiller(this.grantOveraward, 10);
    return record.toString();
  }
}
