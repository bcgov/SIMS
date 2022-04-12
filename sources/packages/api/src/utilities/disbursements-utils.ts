import { DisbursementValueType } from "../database/entities";
import { Award } from "../esdc-integration/e-cert-full-time-integration/models/e-cert-full-time-integration.model";

const FIELD_OF_STUDY_LENGTH = 2;

/**
 * Extract from the list of awards (disbursement values)
 * the specific types.
 * @param awards list of awards (disbursement values).
 * @param types types to be extracted.
 * @returns list of awards of the specified types.
 */
export function getDisbursementValuesByType(
  awards: Award[],
  types: DisbursementValueType[],
): Award[] {
  return awards.filter((award) => types.includes(award.valueType));
}

/**
 * Get the sum of the awards (disbursement values)
 * for the specific types.
 * @param awards list of awards (disbursement values).
 * @param types types sum and get the total.
 * @returns sum of the awards (disbursement values)
 * for the specific types.
 */
export function getTotalDisbursementAmount(
  awards: Award[],
  types: DisbursementValueType[],
): number {
  return getDisbursementValuesByType(awards, types).reduce(
    (totalAmount, award) => totalAmount + +award.valueAmount,
    0,
  );
}

/**
 * Field of study is present on the first 2 numbers of the CIP code.
 * The format is enforced to have the first 2 characters as numbers.
 * @param cipCode CIP code to extract the field of study.
 * @returns field of study extracted from the CIP code.
 */
export function getFieldOfStudyFromCIPCode(cipCode: string): number | null {
  if (cipCode?.length >= FIELD_OF_STUDY_LENGTH) {
    return +cipCode.substr(0, FIELD_OF_STUDY_LENGTH);
  }
  return null;
}

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
