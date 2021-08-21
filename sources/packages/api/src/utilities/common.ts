/**
 * commonly used functions
 */
import * as dayjs from "dayjs";
import * as utc from "dayjs/plugin/utc"; // import plugin
import * as localizedFormat from "dayjs/plugin/localizedFormat"; // import plugin
dayjs.extend(utc);
dayjs.extend(localizedFormat);

export function common() {
  /**
   * get utc date time now
   * @returns date now in utc
   */
  const getUTCNow = () => {
    return dayjs().utc().toDate();
  };

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

  return { getUTCNow, dateString };
}
