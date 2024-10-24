import { SpecializedStringBuilder } from "@sims/utilities";

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
   * Get the information as a fixed line format to be
   * added to the file uploaded to the SFTP.
   * @returns fixed line formatted.
   */
  getFixedFormat(): string {
    const record = new SpecializedStringBuilder({
      stringFiller: this.spaceFiller,
      numberFiller: this.numberFiller,
      dateFiller: this.spaceFiller,
      dateFormat: this.dateFormat,
    });
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
    record.appendOptionalNumberWithFiller(this.fullTimeMSFAANumber, 10);
    record.appendOptionalFormattedDate(this.fullTimeMSFAASignedDate);
    record.appendOptionalNumberWithFiller(this.partTimeMSFAANumber, 10);
    record.appendOptionalFormattedDate(this.partTimeMSFAASignedDate);
    record.appendOptionalStringWithFiller(this.casSupplierNumber, 7);
    record.appendOptionalStringWithFiller(this.casSiteNumber, 3);
    record.append(this.convertToAmountText(this.fullTimeCSLOveraward));
    record.append(this.convertToAmountText(this.fullTimeBCSLOveraward));
    record.append(this.convertToAmountText(this.grantOveraward));
    return record.toString();
  }
}
