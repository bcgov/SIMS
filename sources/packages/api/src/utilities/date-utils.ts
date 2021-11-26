/**
 * commonly used functions
 */
import * as dayjs from "dayjs";
import * as utc from "dayjs/plugin/utc";
import * as localizedFormat from "dayjs/plugin/localizedFormat";
import * as timezone from "dayjs/plugin/timezone";
import * as dayOfYear from "dayjs/plugin/dayOfYear";
import { EXTENDED_DATE_FORMAT } from "../utilities";

dayjs.extend(utc);
dayjs.extend(localizedFormat);
dayjs.extend(timezone);
dayjs.extend(dayOfYear);

export const DATE_ONLY_ISO_FORMAT = "YYYY-MM-DD";

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
 * Convert a string or date to a string format like "Thu Aug 05 2021".
 * @param date string or date to be converted.
 * @returns string representation (e.g. Thu Aug 05 2021).
 */
export const dateString = (date: string | Date): string => {
  if (date) {
    if (date instanceof Date) {
      return date.toDateString();
    }
    return new Date(date).toDateString();
  }
  return "";
};

/**
 * find the date difference
 * @param firstDate first date.
 * @param lastDate Last date.
 * @returns the date difference in days.
 */
export const dateDifference = (
  firstDate: string | Date,
  lastDate: string | Date,
): number => {
  const date1 = new Date(firstDate).getTime();
  const date2 = new Date(lastDate).getTime();
  const difference = date2 - date1;
  return difference / (1000 * 60 * 60 * 24);
};

/**
 * convert the date to (PST: UTC−08:00/PDT: UTC−07:00)
 * @param date date to be converted to PST.
 * @param local, if local is set to true,
 * then the offset will be directly append to the date without
 * converting to the timezone actual date,
 * if set to false, the date will be converted
 * to the actual timezone time with offset
 * @returns date in  PST/PDT(PST: UTC−08:00, PDT: UTC−07:00)
 */
export const getPSTPDTDate = (date: string | Date, local = false): string => {
  return dayjs(new Date(date)).tz("America/Vancouver", local).format();
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
  return dayjs(date).tz("America/Vancouver", local).startOf("day").format();
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
 * Get the day of the year (1-366), considering the leap year.
 * @param day day to retrieve the number.
 * @returns day of the year (1-366), considering the leap year.
 */
export function getDayOfTheYear(day: Date): number {
  return dayjs(day).dayOfYear();
}

/**
 * Get the extended date format(March, 22 2021) for the date given
 * @param date date to be retrieved as Extended date format
 * @returns extended date format like March, 22 2021
 */
export function getExtendedDateFormat(date: Date): string {
  return dayjs(date).format(EXTENDED_DATE_FORMAT);
}
