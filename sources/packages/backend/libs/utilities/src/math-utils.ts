/**
 * Round a number to the nearest decimal number with
 * the specific decimal places.
 * @param decimalValue decimal value to be rounded.
 * @param decimalPlaces number of decimal places to be considered
 * for rounding.
 * @returns if a valid number, returns the rounded number, otherwise returns null.
 */
export function decimalRound(decimalValue: number, decimalPlaces = 2): number {
  const multiplier = Math.pow(10, decimalPlaces);
  return Math.round(decimalValue * multiplier) / multiplier;
}

/**
 * Ensures that a number is rounded up to the decimal places
 * and have the decimal part combined into the integer part.
 * For instance:
 * - 12345.78999 = 1234579 (79 is the decimal part).
 * - 123.999 = 12400 (00 is the decimal part).
 * - 123.9 = 12390 (90 is the decimal part).
 * - 123 = 12300 (00 is the decimal part).
 * @param decimalNumber decimal number to be rounded.
 * @param decimalPlaces number of decimal places to be considered
 * for rounding.
 * @returns decimal number converted to a integer where the decimals
 * part are rounded and combined into the integer part.
 */
export function combineDecimalPlaces(
  decimalNumber: number,
  decimalPlaces = 2,
): number {
  const multiplier = Math.pow(10, decimalPlaces);
  // Round the number up to the number of decimal places.
  const roundedValue = Math.round(decimalNumber * multiplier) / multiplier;
  // Combine the decimals into the integer part before returning.
  return roundedValue * multiplier;
}
