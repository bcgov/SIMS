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
 * Filler to replace a string with default value, when given value is
 * null or empty.
 * @param value provided value.
 * @param defaultValue default value to replace.
 * @returns value replaced with filler if required.
 */
export function emptyStringFiller(value: string, defaultValue = ""): string {
  return value ?? defaultValue;
}

/**
 * Filler to replace a number with default value, when given value is
 * null.
 * @param value provided value.
 * @param defaultValue default value to replace.
 * @returns value replaced with filler if required.
 */
export function emptyNumberFiller(value: number, defaultValue = 0): number {
  return value ?? defaultValue;
}
