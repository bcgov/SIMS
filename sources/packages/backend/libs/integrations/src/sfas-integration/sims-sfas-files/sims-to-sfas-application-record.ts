import { SIMSToSFASBaseRecord } from "@sims/integrations/sfas-integration/sims-sfas-files/sims-to-sfas-base.record";
import { combineDecimalPlaces } from "@sims/utilities";

/**
 * Student data record for SIMS to SFAS file.
 */
export class SIMSToSFASApplicationRecord extends SIMSToSFASBaseRecord {
  /**
   * The unique key/number used in SIMS to identify this individual student.
   */
  studentId: number;
  /**
   * The application id for the student.
   */
  applicationId: number;
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
  programYear: number;
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
   * Get the information as a fixed line format to be
   * added to the file uploaded to the SFTP.
   * @returns fixed line formatted.
   */
  getFixedFormat(): string {
    const record = this.getStringBuilder();
    record.append(this.recordTypeCode);
    record.appendNumberWithFiller(this.studentId, 10);
    record.appendNumberWithFiller(this.applicationId, 10);
    record.appendFormattedDate(this.studyStartDate);
    record.appendFormattedDate(this.studyEndDate);
    record.append(this.programYear);
    record.appendNumberWithFiller(
      combineDecimalPlaces(this.csgpAwardTotal),
      10,
    );
    record.appendNumberWithFiller(
      combineDecimalPlaces(this.sbsdAwardTotal),
      10,
    );
    record.appendOptionalFormattedDate(this.applicationCancelDate);
    return record.toString();
  }
}
