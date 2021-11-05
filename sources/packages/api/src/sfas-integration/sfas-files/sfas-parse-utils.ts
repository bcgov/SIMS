import { getDateOnlyFromFormat } from "../../utilities";
import * as dayjs from "dayjs";

// Expected date only format received from SFAS.
const DATE_FORMAT = "YYYYMMDD";
// Expected date and time format received from SFAS.
const DATE_TIME_FORMAT = "YYYYMMDDHHMMSS";

/**
 * Parse a date received from SFAS in the format YYYYMMDD.
 * @param stringDate date as string in the format YYYYMMDD.
 * @returns new date object with time defined as zero local time.
 */
export function parseDate(stringDate?: string): Date | undefined {
  if (stringDate?.trim().length === DATE_FORMAT.length) {
    return getDateOnlyFromFormat(stringDate, DATE_FORMAT);
  }
  return undefined;
}

/**
 * Parse a date and time received from SFAS in the format YYYYMMDDHHMMSS.
 * @param stringDate date and time as string in the format YYYYMMDDHHMMSS.
 * @returns new date object with time.
 */
export function parseDateTime(stringDateTime?: string): Date | undefined {
  if (stringDateTime?.trim().length === DATE_TIME_FORMAT.length) {
    return dayjs(stringDateTime, DATE_TIME_FORMAT).toDate();
  }
  return undefined;
}

/**
 * Parse a string to a decimal number considering the format received from SFAS.
 */
export function parseDecimal(decimalString: string): number | undefined {
  // Divide by 100 to convert to 2 decimal places.
  return +decimalString / 100;
}
