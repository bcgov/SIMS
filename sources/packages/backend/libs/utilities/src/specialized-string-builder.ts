import { DATE_ONLY_ISO_FORMAT, StringBuilder } from ".";

/**
 * Advanced string builder with specialized functions.
 */
export class SpecializedStringBuilder extends StringBuilder {
  private readonly stringFiller: string;
  private readonly numberFiller: string;
  private readonly dateFiller: string;
  private readonly dateFormat: string;
  constructor(options?: {
    stringFiller?: string;
    numberFiller?: string;
    dateFiller?: string;
    dateFormat?: string;
  }) {
    super();
    this.stringFiller = options?.stringFiller ?? "";
    this.numberFiller = options?.numberFiller ?? "";
    this.dateFiller = options?.dateFiller ?? "";
    this.dateFormat = options?.dateFormat ?? DATE_ONLY_ISO_FORMAT;
  }

  /**
   * Append string value with filler.
   * @param value string value.
   * @param length maximum length.
   */
  appendStringWithFiller(value: string, length: number): void {
    this.appendWithEndFiller(value, length, this.stringFiller);
  }

  /**
   * Append number value with filler.
   * @param value number value.
   * @param length maximum length.
   */
  appendNumberWithFiller(value: number, length: number): void {
    this.appendWithStartFiller(value, length, this.numberFiller);
  }

  /**
   * Append optional string value with filler.
   * @param value string value.
   * @param length maximum length.
   */
  appendOptionalStringWithFiller(value: string, length: number): void {
    this.appendStringWithFiller(value ?? "", length);
  }

  /**
   * Append optional number value with filler.
   * @param value number value.
   * @param length maximum length.
   */
  appendOptionalNumberWithFiller(value: number, length: number): void {
    this.appendNumberWithFiller(value ?? 0, length);
  }

  /**
   * Append formatted date.
   * @param date date value.
   */
  appendFormattedDate(date: Date | string): void {
    this.appendDate(date, this.dateFormat);
  }

  /**
   * Append formatted date with filler.
   * @param date optional date value.
   */
  appendOptionalFormattedDate(date: Date | string): void {
    if (date) {
      this.appendDate(date, this.dateFormat);
      return;
    }
    this.append("".padStart(this.dateFormat.length, this.dateFiller));
  }
}
