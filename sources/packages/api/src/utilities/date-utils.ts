/**
 * commonly used functions
 */
import * as dayjs from "dayjs";
import * as utc from "dayjs/plugin/utc";
import * as localizedFormat from "dayjs/plugin/localizedFormat";
import * as timezone from "dayjs/plugin/timezone";
import * as dayOfYear from "dayjs/plugin/dayOfYear";
import * as isBetween from "dayjs/plugin/isBetween";
import { EXTENDED_DATE_FORMAT } from "../utilities";
dayjs.extend(utc);
dayjs.extend(localizedFormat);
dayjs.extend(timezone);
dayjs.extend(dayOfYear);
dayjs.extend(isBetween);

export const DATE_ONLY_ISO_FORMAT = "YYYY-MM-DD";
export const DATE_ONLY_FORMAT = "MMM DD YYYY";
export const DATE_TIME_FORMAT = "YYYY-MM-DD HH:mm:ss";
export const TIMESTAMP_CONTINUOUS_FORMAT = "YYYY-MM-DD_HH.mm.ss";
export const PST_TIMEZONE = "America/Vancouver";

/**
 * get utc date time now
 * @returns date now in utc
 */
export const getUTCNow = (): Date => {
  return dayjs().utc().toDate();
};

/**
 * Convert the local date to UTC
 * @returns date converted to UTC.
 */
export const getUTC = (localDate: Date): Date => {
  return dayjs(localDate).utc().toDate();
};

/**
 * Difference in days between endDate and startDate (endDate-startDate).
 * @param endDate end date.
 * @param startDate start date.
 * @returns the date difference in days.
 */
export const dateDifference = (
  endDate: string | Date,
  startDate: string | Date,
): number => {
  return dayjs(endDate).diff(startDate, "days");
};

/**
 * Convert the date to (PST: UTC−08:00/PDT: UTC−07:00).
 * @param date date to be converted to PST.
 * @param local, if local is set to true,
 * then the offset will be directly append to the date without
 * converting to the timezone actual date,
 * if set to false, the date will be converted
 * to the actual timezone time with offset.
 * @returns date in  PST/PDT(PST: UTC−08:00, PDT: UTC−07:00).
 */
export const getPSTPDTDate = (date: string | Date, local = false): string => {
  return dayjs(new Date(date)).tz(PST_TIMEZONE, local).format();
};

/**
 * Convert the date to (PST: UTC−08:00/PDT: UTC−07:00).
 * @param date date to be converted to PST.
 * @param local, if local is set to true,
 * then the offset will be directly append to the date without
 * converting to the timezone actual date,
 * if set to false, the date will be converted
 * to the actual timezone time with offset.
 * @returns date in YYYY-MM-DD HH:mm:ss format.
 */
export const getPSTPDTDateTime = (
  date: string | Date,
  local = false,
): string => {
  return dayjs(new Date(date)).tz(PST_TIMEZONE, local).format(DATE_TIME_FORMAT);
};

/**
 * set date to start of the day with PST/PDT offset,
 * for eg, Aug 24th 2021 will be 2021-08-24T00:00:00-07:00
 * @param date date to be updated.
 * @param local, if local is set to true,
 * then the offset will be directly append to the date without
 * converting to the timezone actual date,
 * if set to false, the date will be converted
 * to the actual timezone time with offset
 * @returns date string
 */
export const setToStartOfTheDayInPSTPDT = (
  date: string | Date,
  local = false,
): string => {
  return dayjs(date).tz(PST_TIMEZONE, local).startOf("day").format();
};

/***
 * Parse a new string in the expected format YYYY-MM-DD and returns
 * a new Date object with the local time defined as 00:00:00.
 */
export function getDateOnly(stringDate: string): Date | null {
  if (stringDate) {
    return new Date(`${stringDate}T00:00:00`);
  }
  return null;
}

export function getDateOnlyFromFormat(
  stringDate: string,
  stringDateFormat: string,
): Date | null {
  const isoDate = dayjs(stringDate, stringDateFormat).format(
    DATE_ONLY_ISO_FORMAT,
  );
  return getDateOnly(isoDate);
}

/**
 * Get the date only part of a date/time object.
 * @param date date/time to have the date extracted.
 * @returns date only string in ISO format YYYY-MM-DD.
 */
export function getISODateOnlyString(date?: Date | string): string | null {
  if (!date) {
    return null;
  }
  return dayjs(date).format(DATE_ONLY_ISO_FORMAT);
}

/**
 * Get the extended date format(March, 22 2021) for the date given
 * @param date date to be retrieved as Extended date format
 * @returns extended date format like March, 22 2021
 */
export function getExtendedDateFormat(date: Date): string {
  return dayjs(date).format(EXTENDED_DATE_FORMAT);
}

/**
 * Get the extended date format(2021 Mar 22) for the date given
 * @param date date to be retrieved as Extended date format
 * @returns extended date format like Mar 22 2021
 */
export function getDateOnlyFormat(date?: string | Date): string {
  return dayjs(date).format(DATE_ONLY_FORMAT);
}

/**
 *
 * @param date Add days to a given date.
 * @param daysToAdd
 * @returns Date.
 */
export const addDays = (date: Date | string, daysToAdd: number): Date => {
  return dayjs(date).add(daysToAdd, "day").toDate();
};

/**
 * Return a PST timestamp with date and time in continuous format
 * mainly used to append in filename.
 * @returns timestamp.
 */
export function getFileNameAsCurrentTimestamp(): string {
  return dayjs(new Date()).tz(PST_TIMEZONE).format(TIMESTAMP_CONTINUOUS_FORMAT);
}

/**
 * Period defined by a start and end date.
 */
export interface Period {
  startDate: Date | string;
  endDate: Date | string;
}

/**
 * Checks if date is between a period (inclusive check).
 * @param date date to be checked.
 * @param period period to be checked.
 * @returns true if the date belongs to the period.
 */
export function isBetweenPeriod(date: Date | string, period: Period): boolean {
  return dayjs(date).isBetween(period.startDate, period.endDate, "days", "[]");
}

/**
 * Checks if the periodA has any overlap with the periodB.
 * @param periodA first period to be tested.
 * @param periodB second period to be tested.
 * @returns true if the periods have some overlap, otherwise, false.
 */
export function hasPeriodOverlap(periodA: Period, periodB: Period): boolean {
  return (
    // Start date is in between the periodB (inclusive check).
    isBetweenPeriod(periodA.startDate, periodB) ||
    // End date is in between the periodB (inclusive check).
    isBetweenPeriod(periodA.endDate, periodB) ||
    // PeriodA fully contains period B.
    (dayjs(periodA.startDate).isBefore(periodB.startDate) &&
      dayjs(periodA.endDate).isAfter(periodB.endDate))
  );
}

/**
 * Checks if there is any intersection between all the periods provided.
 * @param periods periods to check for intersections.
 * @returns true if any period has a intersection with any other period.
 */
export function hasSomePeriodOverlap(periods: Period[]): boolean {
  for (let i = 0; i < periods.length; i++) {
    // Period to be tested against all the others.
    const currentPeriod = periods[i];
    // All periods but the currentPeriod.
    const testPeriods = periods.filter((_, index) => index !== i);
    const hasSomeIntersection = testPeriods.some((testPeriod) =>
      hasPeriodOverlap(currentPeriod, testPeriod),
    );
    if (hasSomeIntersection) {
      return true;
    }
  }
  return false;
}
