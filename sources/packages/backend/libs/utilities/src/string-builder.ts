import * as dayjs from "dayjs";

export const END_OF_LINE = "\r\n";
/**
 * Allow the construction of a large string piece by
 * piece with some useful methods to help the
 * string manipulation.
 */
export class StringBuilder {
  private readonly contents: string[] = [];

  /**
   * Appends a string to the current content.
   * @param input input to append.
   * @param maxLength maximum length to be considered from
   * input.
   */
  public append(input: string | number, maxLength?: number) {
    let convertedString = input.toString();
    if (maxLength && convertedString.length > maxLength) {
      convertedString = convertedString.substring(0, maxLength);
    }
    this.contents.push(convertedString);
  }

  /**
   * Appends a string to the current content
   * alongside with a line break.
   * @param s
   */
  public appendLine(s: string) {
    this.append(s);
    this.append("\n");
  }

  /**
   * Appends a fixed size string to the current content.
   * @param s String to be appended.
   * @param length Fixed string length.
   * @param filler The string to pad the string being appended.
   */
  public appendWithEndFiller(s: string, length: number, filler: string) {
    if (s.length > length) {
      s = s.substring(0, length);
    }
    this.append(s.padEnd(length, filler));
  }

  /**
   * Appends a fixed size string to the current content.
   * @param s String to be appended.
   * @param length Fixed string length.
   * @param filler The string to pad the string being appended.
   */
  public appendWithStartFiller(
    s: string | number,
    length: number,
    filler: string,
  ) {
    this.append(s.toString().padStart(length, filler));
  }

  /**
   * Appends a repeated string to the current content.
   * @param s String to be appended.
   * @param length Fixed string length.
   */
  public repeatAppend(s: string, length: number) {
    this.append(s.repeat(length));
  }

  /**
   * Appends a date in a specific format to the current content.
   * @param date date to be formatted.
   * @param dateFormat format.
   */
  public appendDate(date: Date | string, dateFormat: string) {
    this.append(dayjs(date).format(dateFormat));
  }

  /**
   * Outputs the current content.
   * @returns Current content.
   */
  public toString(): string {
    return this.contents.join("");
  }
}

/**
 * Advanced string builder with specialized functions.
 */
export class AdvancedStringBuilder extends StringBuilder {
  private readonly stringFiller: string;
  private readonly numberFiller: string;
  private readonly dateFiller: string;
  constructor(stringFiller: string, numberFiller: string, dateFiller: string) {
    super();
    this.stringFiller = stringFiller;
    this.numberFiller = numberFiller;
    this.dateFiller = dateFiller;
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
   * Append optional date value with filler.
   * @param date optional date value.
   * @param dateFormat date format.
   */
  appendOptionalDate(date: Date | string, dateFormat: string): void {
    if (date) {
      this.appendDate(date, dateFormat);
      return;
    }
    this.append("".padStart(dateFormat.length, this.dateFiller));
  }
}
