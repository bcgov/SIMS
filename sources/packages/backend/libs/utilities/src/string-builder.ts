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
   * Appends a fixed size string to the current content.
   * If the string is longer than the specified length, it will be truncated.
   * The string will be padded with the specified filler string to the specified length.
   * The padding is applied in two stages: first the end of the string is padded with the specified
   * end pad length, and then the start of the string is padded with the remaining length.
   * @param s String to be appended.
   * @param length Fixed string length.
   * @param endPadLength The length of the padding to be applied at the end of the string.
   * @param filler The string to pad the string being appended.
   */
  public appendWithStartAndEndFiller(
    s: string,
    length: number,
    endPadLength: number,
    filler: string,
  ) {
    if (s.length > length) {
      s = s.substring(0, length);
    }
    const totalPadLength = length - s.length;
    // Pad the end first with the specified end pad length.
    if (totalPadLength <= endPadLength) {
      s = s.padEnd(length, filler);
    } else {
      const startPadLength = totalPadLength - endPadLength;
      s = s.padStart(s.length + startPadLength, filler).padEnd(length, filler);
    }
    this.append(s);
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
