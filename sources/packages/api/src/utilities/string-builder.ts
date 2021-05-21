import * as dayjs from "dayjs";

/**
 * Allow the construction of a large string piece by
 * piece with some useful methods to help the
 * string manipulation.
 */
export class StringBuilder {
  private readonly contents: string[] = [];

  /**
   * Appends a string to the current content.
   * @param s
   */
  public append(s: string) {
    this.contents.push(s);
  }

  /**
   * Appends a fixed size string to the current content.
   * @param s String to be appended.
   * @param length Fixed string length.
   * @param filler The string to pad the string being appended.
   */
  public appendWithEndFiller(s: string, length: number, filler: string) {
    this.append(s.padEnd(length, filler));
  }

  /**
   * Appends a fixed size string to the current content.
   * @param s String to be appended.
   * @param length Fixed string length.
   * @param filler The string to pad the string being appended.
   */
  public appendWithStartFiller(s: string, length: number, filler: string) {
    this.append(s.padStart(length, filler));
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
   * @param date
   * @param dateFormat
   */
  public appendDate(date: Date, dateFormat: string) {
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
