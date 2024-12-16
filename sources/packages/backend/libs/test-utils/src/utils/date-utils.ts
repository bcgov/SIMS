import { DATE_ONLY_ISO_FORMAT, PST_TIMEZONE } from "@sims/utilities";
import * as dayjs from "dayjs";

/**
 * Checks if a string has a valid date timestamp file format.
 * @param timestamp timestamp to be validated.
 * @returns true if the format is the expected.
 */
export function isValidFileTimestamp(timestamp: string): boolean {
  return dayjs(timestamp, "YYYYMMDD-HHmmssSSS").isValid();
}

/**
 * Add years to a given date.
 * @param yearsToAdd number of years to be added.
 * @param date date.
 * @returns a new date with years added.
 */
export const addYears = (yearsToAdd: number, date?: Date | string): Date => {
  return dayjs(date ?? new Date())
    .add(yearsToAdd, "year")
    .toDate();
};

/**
 * Add milliseconds to a given date.
 * @param yearsToAdd number of years to be added.
 * @param date date.
 * @returns a new date with years added.
 */
export const addMilliSeconds = (
  milliSecondsToAdd: number,
  date?: Date | string,
): Date => {
  return dayjs(date ?? new Date())
    .add(milliSecondsToAdd, "millisecond")
    .toDate();
};

/**
 * Convert the date to PST/PDT(PST: UTC−08:00, PDT: UTC−07:00) and format.
 * @param date date.
 * @param format date format.
 * @returns converted date in the given format.
 */
export function getPSTPDTDateFormatted(
  date: Date | string,
  format = DATE_ONLY_ISO_FORMAT,
): string {
  return dayjs(new Date(date)).tz(PST_TIMEZONE, false).format(format);
}
