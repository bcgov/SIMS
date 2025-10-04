import { getDateOnlyFromFormat } from "@sims/utilities";
import * as dayjs from "dayjs";

// Expected date only format received from SFAS.
const DATE_FORMAT = "YYYYMMDD";
// Expected date and time format received from SFAS.
const DATE_TIME_FORMAT = "YYYYMMDDHHmmss";

/**
 * Parse a date received from SFAS in the format YYYYMMDD.
 * @param stringDate date as string in the format YYYYMMDD.
 * @returns new date object with time defined as zero local time.
 */
export function parseDate(stringDate?: string): Date | null {
  if (stringDate?.trim().length === DATE_FORMAT.length) {
    return getDateOnlyFromFormat(stringDate, DATE_FORMAT);
  }
  return null;
}

/**
 * Parse a date and time received from SFAS in the format YYYYMMDDHHmmss.
 * @param stringDate date and time as string in the format YYYYMMDDHHmmss.
 * @returns new date object with time.
 */
export function parseDateTime(stringDateTime?: string): Date | null {
  if (stringDateTime?.trim().length === DATE_TIME_FORMAT.length) {
    return dayjs(stringDateTime, DATE_TIME_FORMAT).toDate();
  }
  return null;
}

/**
 * Parse a string to a decimal number considering the format received from SFAS.
 */
export function parseDecimal(decimalString: string): number | null {
  // Divide by 100 to convert to 2 decimal places.
  return +decimalString / 100;
}

/**
 * Parse a number from a string with default value.
 * @param value number string.
 * @param defaultValue default value.
 * @returns converted number.
 */
export function parseInteger(
  value: string,
  defaultValue: 0 | null = null,
): number | null {
  const numberValue = parseInt(value, 10);
  return Number.isFinite(numberValue) ? numberValue : defaultValue;
}
