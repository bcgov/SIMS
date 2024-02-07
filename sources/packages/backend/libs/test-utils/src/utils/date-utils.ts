import * as dayjs from "dayjs";

/**
 * Checks if a string has a valid date timestamp file format.
 * @param timestamp timestamp to be validated.
 * @returns true if the format is the expected.
 */
export function isValidFileTimestamp(timestamp: string): boolean {
  return dayjs(timestamp, "YYYYMMDD-HHmmssSSS").isValid();
}
