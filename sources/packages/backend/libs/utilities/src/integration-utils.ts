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
 * Round a number to the nearest decimal number with
 * the specific decimal places.
 * @param decimalValue decimal value to be rounded.
 * @param decimalPlaces number of decimal places to be considered
 * for rounding.
 * @returns if a valid number, returns the rounded number, otherwise null.
 */
export function decimalRound(decimalValue: number, decimalPlaces = 2): number {
  const multiplier = Math.pow(10, decimalPlaces);
  return Math.round(decimalValue * multiplier) / multiplier;
}
