import { FixedFormatFileLine } from "@sims/integrations/services/ssh";
import { SIMSToSFASRecordTypeCodes } from "../sfas-integration.models";
import { SpecializedStringBuilder } from "@sims/utilities";

export abstract class SIMSToSFASBaseRecord implements FixedFormatFileLine {
  /**
   * Type of record.
   */
  recordTypeCode: SIMSToSFASRecordTypeCodes;
  /**
   * File record date format.
   */
  private readonly dateFormat = "YYYYMMDD";
  /**
   * File record space filler.
   */
  private readonly spaceFiller = " ";
  /**
   * File record number filler.
   */
  private readonly numberFiller = "0";
  /**
   * File record date time format.
   */
  protected readonly dateTimeFormat = "YYYYMMDDHHmmss";

  /**
   * Get string builder with fillers and date format
   * with respect ti SIMS to SFAS file.
   */
  get stringBuilder(): SpecializedStringBuilder {
    return new SpecializedStringBuilder({
      stringFiller: this.spaceFiller,
      numberFiller: this.numberFiller,
      dateFiller: this.spaceFiller,
      dateFormat: this.dateFormat,
    });
  }

  /**
   * Get the information as a fixed line format to be
   * added to the file uploaded to the SFTP.
   * @returns fixed line formatted.
   */
  abstract getFixedFormat(): string;
}
