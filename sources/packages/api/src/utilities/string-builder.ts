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
  public Append(s: string) {
    this.contents.push(s);
  }

  /**
   * Appends a fixed size string to the current content.
   * @param s String to be appended.
   * @param length Fixed string length.
   * @param filler The string to pad the string being appended.
   */
  public AppendWithEndFiller(s: string, length: number, filler: string) {
    this.Append(s.padEnd(length, filler));
  }

  /**
   * Appends a fixed size string to the current content.
   * @param s String to be appended.
   * @param length Fixed string length.
   * @param filler The string to pad the string being appended.
   */
  public AppendWithStartFiller(s: string, length: number, filler: string) {
    this.Append(s.padStart(length, filler));
  }

  /**
   * Appends a repeated string to the current content.
   * @param s String to be appended.
   * @param length Fixed string length.
   */
  public RepeatAppend(s: string, length: number) {
    this.Append(s.repeat(length));
  }

  /**
   * Appends a date in a specific format to the current content.
   * @param date
   * @param dateFormat
   */
  public AppendDate(date: Date, dateFormat: string) {
    this.Append(dayjs(date).format(dateFormat));
  }

  /**
   * Outputs the current content.
   * @returns Current content.
   */
  public ToString(): string {
    return this.contents.join("");
  }
}
