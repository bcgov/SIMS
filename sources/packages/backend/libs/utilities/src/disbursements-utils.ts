import { Award } from "@sims/integrations/esdc-integration/e-cert-integration/models/e-cert-integration-model";
import { DisbursementValueType } from "@sims/sims-db";

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
 * Get the sum of the awards value amount (disbursement values)
 * for the specific types generated during the assessment calculation.
 * @param awards list of awards (disbursement values).
 * @param types types to sum and get the total.
 * @returns sum of the awards (disbursement values)
 * for the specific types.
 */
export function getTotalDisbursementAmount(
  awards: Award[],
  types: DisbursementValueType[],
): number {
  return getDisbursementValuesByType(awards, types).reduce(
    (totalAmount, award) => totalAmount + award.valueAmount,
    0,
  );
}

/**
 * Get the sum of the awards effective values (disbursement values)
 * for the specific types.
 * !Effective award value is available only after the e-Cert is generated
 * !and the overaward deductions or possible restrictions are applied.
 * @param awards list of awards (disbursement values).
 * @param types types to sum and get the total.
 * @returns sum of the awards effective value (disbursement values)
 * for the specific types.
 */
export function getTotalDisbursementEffectiveAmount(
  awards: Award[],
  types: DisbursementValueType[],
): number {
  return getDisbursementValuesByType(awards, types).reduce(
    (totalAmount, award) => totalAmount + +award.effectiveAmount,
    0,
  );
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

/**
 * Get the award effective amount by the award value code (e.g. CSGD, CSGP, CSGPT).
 * !Effective award value is available only after the e-Cert is generated
 * !and the overaward deductions or possible restrictions are applied.
 * @param awards list of awards (disbursement values).
 * @param valueCode valueCode to be extracted.
 * @returns award amount of the specified types. If the code is not present
 * it will return 0 (zero).
 */
export function getDisbursementEffectiveAmountByValueCode(
  awards: Award[],
  valueCode: string,
): number {
  const award = awards.find((award) => award.valueCode === valueCode);
  if (award?.effectiveAmount) {
    return +award.effectiveAmount;
  }
  return 0;
}
