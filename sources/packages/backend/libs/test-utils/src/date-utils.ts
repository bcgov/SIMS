import * as dayjs from "dayjs";

/**
 * Format date as per the given date format.
 * @param date date
 * @param dateFormat date format.
 * @returns date string as per the given format.
 */
export function formatDate(
  date: Date | string,
  dateFormat: string,
): string | null {
  if (!date) {
    return null;
  }
  return dayjs(date).format(dateFormat);
}
