import { FixedFormatFileLine } from "@sims/integrations/services/ssh";
import { SIMSToSFASRecordTypeCodes } from "../sfas-integration.models";

export abstract class SIMSToSFASBaseRecord implements FixedFormatFileLine {
  /**
   * Type of record.
   */
  recordTypeCode: SIMSToSFASRecordTypeCodes;
  /**
   * File record date format.
   */
  protected readonly dateFormat = "YYYYMMDD";
  /**
   * File record space filler.
   */
  protected readonly spaceFiller = " ";
  /**
   * File record number filler.
   */
  protected readonly numberFiller = "0";
  /**
   * Convert amount to fixed length text of 10 characters
   * where the first 8 characters are whole number and the last 2 characters are fraction.
   * e.g. `100` to `0000010000`(100.00).
   ** The method is not responsible for rounding the amount if the amount has more than 2 decimal values.
   ** The `toFixed` method will round the amount if there are more than 2 decimal values which may
   ** cause unexpected result.
   * @param amount amount.
   * @returns fixed length amount text.
   */
  protected convertToAmountText(amount?: number): string {
    const amountValue = amount ?? 0;
    const [wholeNumber, fraction] = amountValue.toFixed(2).split(".");
    const wholeNumberPadded = wholeNumber.padStart(8, this.numberFiller);
    return `${wholeNumberPadded}${fraction}`;
  }
  abstract getFixedFormat(): string;
}
