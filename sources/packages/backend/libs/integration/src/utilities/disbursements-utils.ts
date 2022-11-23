/**
 * Round a number or string to the nearest integer (0.5 rounds up).
 * @param decimalValue decimal value as number or string.
 * @returns if a valid number, returns the rounded number, otherwise null.
 */
export function round(decimalValue: number | string): number | null {
  const parsedDecimalValue = parseFloat(decimalValue.toString());
  if (isNaN(parsedDecimalValue)) {
    return null;
  }
  return Math.round(parsedDecimalValue);
}
