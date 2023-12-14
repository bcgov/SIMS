const REPLACE_LINE_BREAK_REGEX = /\r?\n|\r/g;
/**
 * Express the completion years data present on educational programs as
 * an amount of years.
 * * This information is not supposed to be relevant enough to stop a
 * * disbursement to happen if not accurate.
 */
export function getTotalYearsOfStudy(completionYears: string): number {
  switch (completionYears) {
    case "12WeeksToLessThan1Year":
      return 1;
    case "1YearToLessThan2Years":
      return 2;
    case "2YearsToLessThan3Years":
      return 3;
    case "3YearsToLessThan4Years":
      return 4;
    case "4YearsToLessThan5Years":
      return 5;
    case "5YearsOrMore":
      return 6;
    default:
      return 1;
  }
}

/**
 * Replace the line breaks in the given text.
 * @param data data to replace the line break.
 * @param options replace options:
 * - `replaceText`: text to replace the line break.
 * @returns line break replaced string.
 */
export function replaceLineBreaks(
  data?: string,
  options?: { replaceText?: string },
) {
  if (!data) {
    return data;
  }
  return data.replace(REPLACE_LINE_BREAK_REGEX, options?.replaceText ?? "");
}
