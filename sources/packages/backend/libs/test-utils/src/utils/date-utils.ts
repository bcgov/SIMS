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
 * @param date  date.
 * @returns a new date with years added.
 */
export const addYears = (yearsToAdd: number, date?: Date | string): Date => {
  return dayjs(date ? date : new Date())
    .add(yearsToAdd, "year")
    .toDate();
};

/**
 * Add milliseconds to a given date.
 * @param yearsToAdd number of years to be added.
 * @param date  date.
 * @returns a new date with years added.
 */
export const addMilliSeconds = (
  milliSecondsToAdd: number,
  date?: Date | string,
): Date => {
  return dayjs(date ? date : new Date())
    .add(milliSecondsToAdd, "millisecond")
    .toDate();
};
