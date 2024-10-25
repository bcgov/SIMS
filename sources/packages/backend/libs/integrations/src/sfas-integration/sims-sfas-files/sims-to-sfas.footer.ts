import { SpecializedStringBuilder } from "@sims/utilities";
import { SIMSToSFASBaseRecord } from "./sims-to-sfas-base.record";

/**
 * Footer record for SIMS to SFAS file.
 */
export class SIMSToSFASFooter extends SIMSToSFASBaseRecord {
  /**
   * Total record count of all records that are not header and trailer records.
   ** There is no clear requirement currently to map this field. It is populated with filler values.
   */
  totalRecordsCount?: number;

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
    record.appendOptionalNumberWithFiller(this.totalRecordsCount, 9);
    return record.toString();
  }
}
