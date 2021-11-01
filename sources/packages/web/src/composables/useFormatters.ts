import dayjs, { QUnitType, OpUnitType } from "dayjs";

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

  /**
   * Get Date difference in given units
   * @param fromDate fromDate.
   * @param toDate toDate.
   * @param unit unit to be converted, below are units
   * (reference:: https://day.js.org/docs/en/display/difference)
   * Unit	- Shorthand -	Description
   * day - d - Day of Week (Sunday as 0, Saturday as 6)
   * week	- w - Week of Year
   * quarter - Q	-Quarter
   * month - M	- Month (January as 0, December as 11)
   * year	- y - Year
   * hour	- h	- Hour
   * minute	- m	- Minute
   * second	- s	- Second
   * millisecond - ms	- Millisecond
   * @param notInt By default, dayjs#diff will truncate
   * the result to zero decimal places, returning an integer.
   * If you want a floating point number, pass true as the
   * third argument.
   * @returns returns the difference between dates in passed units.
   */
  const getDatesDiff = (
    fromDate: string | Date,
    toDate: string | Date,
    unit: QUnitType | OpUnitType,
    notInt = false,
  ): number => {
    if (fromDate && toDate) {
      return dayjs(toDate).diff(dayjs(fromDate), unit, notInt);
    }
    return 0;
  };

  return { dateString, dateOnlyLongString, getDatesDiff };
}
