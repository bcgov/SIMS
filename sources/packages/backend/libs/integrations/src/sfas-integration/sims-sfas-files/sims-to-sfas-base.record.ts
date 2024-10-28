import { FixedFormatFileLine } from "@sims/integrations/services/ssh";
import { SIMSToSFASRecordTypeCodes } from "../sfas-integration.models";
import { SpecializedStringBuilder } from "@sims/utilities";

export abstract class SIMSToSFASBaseRecord implements FixedFormatFileLine {
  /**
   * Type of record.
   */
  recordTypeCode: SIMSToSFASRecordTypeCodes;

  /**
   * Get string builder with fillers and date format
   * with respect to SIMS to SFAS file.
   * @returns string builder.
   */
  protected getStringBuilder(): SpecializedStringBuilder {
    const dateFormat = "YYYYMMDD";
    const spaceFiller = " ";
    const numberFiller = "0";
    return new SpecializedStringBuilder({
      stringFiller: spaceFiller,
      numberFiller: numberFiller,
      dateFiller: spaceFiller,
      dateFormat: dateFormat,
    });
  }

  /**
   * Get the information as a fixed line format to be
   * added to the file uploaded to the SFTP.
   * @returns fixed line formatted.
   */
  abstract getFixedFormat(): string;
}
