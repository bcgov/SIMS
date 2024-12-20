import { SIMSToSFASBaseRecord } from "@sims/integrations/sfas-integration/sims-sfas-files/sims-to-sfas-base.record";

/**
 * Student data record for SIMS to SFAS file.
 */
export class SIMSToSFASRestrictionRecord extends SIMSToSFASBaseRecord {
  /**
   * The unique key/number used in SIMS to identify this individual student.
   */
  studentId: number;
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
    record.appendNumberWithFiller(this.restrictionId, 10);
    record.appendStringWithFiller(this.restrictionCode, 10);
    record.appendFormattedDate(this.restrictionEffectiveDate);
    record.appendOptionalFormattedDate(this.restrictionRemovalDate);
    return record.toString();
  }
}
