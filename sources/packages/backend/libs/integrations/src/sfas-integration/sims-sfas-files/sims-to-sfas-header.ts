import { SpecializedStringBuilder } from "@sims/utilities";
import { FixedFormatFileLine } from "@sims/integrations/services/ssh";
import {
  DATE_FORMAT,
  NUMBER_FILLER,
  SIMSToSFASRecordTypeCodes,
  SPACE_FILLER,
} from "../sfas-integration.models";

/**
 * Header record for SIMS to SFAS file.
 */
export class SIMSToSFASHeader implements FixedFormatFileLine {
  /**
   * Type of record.
   */
  recordTypeCode: SIMSToSFASRecordTypeCodes;
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
    const record = new SpecializedStringBuilder({
      stringFiller: SPACE_FILLER,
      numberFiller: NUMBER_FILLER,
      dateFiller: SPACE_FILLER,
      dateFormat: DATE_FORMAT,
    });
    record.append(this.recordTypeCode);
    record.append(this.originator);
    record.appendStringWithFiller(this.title, 40);
    record.appendFormattedDate(this.creationDate);
    return record.toString();
  }
}
