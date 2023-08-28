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
