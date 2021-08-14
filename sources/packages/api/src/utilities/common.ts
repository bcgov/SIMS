/**
 * commonly used functions
 */
import * as dayjs from "dayjs";

const utc = require("dayjs/plugin/utc");
const localizedFormat = require("dayjs/plugin/localizedFormat");
dayjs.extend(localizedFormat);
dayjs.extend(utc);
/**
 * get utc date time now
 * @returns date now in utc
 */
export const getUTCNow = () => {
  return new Date(dayjs().utc().format("L LT"));
};
