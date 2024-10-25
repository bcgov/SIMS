import { SIMSToSFASBaseRecord } from "./sims-to-sfas-base.record";

/**
 * Header record for SIMS to SFAS file.
 */
export class SIMSToSFASHeader extends SIMSToSFASBaseRecord {
  /**
   * Specifies who sent this file.
   */
  originator: string;
  /**
   * Description of this file.
   */
  title: string;
  /**
   * Date & time that this file was generated in UTC.
   */
  creationDate: Date;
  /**
   * Get the information as a fixed line format to be
   * added to the file uploaded to the SFTP.
   * @returns fixed line formatted.
   */
  getFixedFormat(): string {
    const dateTimeFormat = "YYYYMMDDHHmmss";
    const record = this.stringBuilder;
    record.append(this.recordTypeCode);
    record.append(this.originator);
    record.appendStringWithFiller(this.title, 40);
    record.appendDate(this.creationDate, dateTimeFormat);
    return record.toString();
  }
}
