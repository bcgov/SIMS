/**
 * commonly used functions
 */
import * as dayjs from "dayjs";
import * as utc from "dayjs/plugin/utc"; // import plugin
import * as localizedFormat from "dayjs/plugin/localizedFormat"; // import plugin
dayjs.extend(utc);
dayjs.extend(localizedFormat);
/**
 * get utc date time now
 * @returns date now in utc
 */
export const getUTCNow = () => {
  return new Date(dayjs().utc().format("L LT"));
};
