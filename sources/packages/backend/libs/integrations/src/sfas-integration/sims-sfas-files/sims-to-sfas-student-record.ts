import { SpecializedStringBuilder } from "@sims/utilities";
import { FixedFormatFileLine } from "@sims/integrations/services/ssh";

import {
  DATE_FORMAT,
  NUMBER_FILLER,
  SIMSToSFASRecordTypeCodes,
  SPACE_FILLER,
} from "../sfas-integration.models";
import { YNFlag } from "@sims/integrations/models";

/**
 * Student data record for SIMS to SFAS file.
 */
export class SIMSToSFASStudentRecord implements FixedFormatFileLine {
  /**
   * Type of record.
   */
  recordTypeCode: SIMSToSFASRecordTypeCodes;
  /**
   * The unique key/number used in SIMS to identify this individual student.
   */
  studentId: number;
  /**
   * The given name as defined in SIMS.
   */
  givenName: string;
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
   */
  fullTimeMSFAANumber?: number;
  /**
   * The most recent, active Master Student Loan Agreement signed date for full time.
   */
  fullTimeMSFAASignedDate?: Date;
  /**
   * The most recent, active Master Student Loan Agreement Number for part time.
   */
  partTimeMSFAANumber?: number;
  /**
   * The most recent, active Master Student Loan Agreement signed date for part time.
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
   * Get the information as a fixed line format to be
   * added to the file uploaded to the SFTP.
   * @returns fixed line formatted.
   */
  getFixedFormat(): string {
    const record = new SpecializedStringBuilder({
      stringFiller: SPACE_FILLER,
      numberFiller: NUMBER_FILLER,
      dateFiller: SPACE_FILLER,
      dateFormat: DATE_FORMAT,
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
    record.appendOptionalStringWithFiller(this.casSupplierNumber, 10);

    return record.toString();
  }
}
