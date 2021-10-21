import dayjs from "dayjs";

/**
 * Helpers to adjust how values are shown in the UI.
 */
export function useFormatters() {
  /**
   * Convert a string or date to a string format like "Thu Aug 05 2021".
   * @param date string or date to be converted.
   * @returns string representation (e.g. Thu Aug 05 2021).
   */
  const dateString = (date: string | Date): string => {
    if (date) {
      if (date instanceof Date) {
        return date.toDateString();
      }
      return new Date(date).toDateString();
    }
    return "";
  };

  /**
   * Convert a string or date to a string format like "Aug 05 2021".
   * @param date string or date to be converted.
   * @returns string representation (e.g. Aug 05 2021).
   */
  const dateOnlyLongString = (date: string | Date): string => {
    if (date) {
      return dayjs(date).format("MMM D, YYYY");
    }
    return "";
  };

  return { dateString, dateOnlyLongString };
}
