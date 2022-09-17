import {
  INVALID_SIN_MESSAGE,
  PENDING_SIN_MESSAGE,
} from "@/constants/message-constants";
import { SINValidStatus } from "@/store/modules/student/student";
import { Address, InstitutionUserRoles, SINStatusEnum } from "@/types";
import dayjs, { QUnitType, OpUnitType } from "dayjs";

const DEFAULT_EMPTY_VALUE = "-";
export const DATE_ONLY_ISO_FORMAT = "YYYY-MM-DD";

/**
 * Helpers to adjust how values are shown in the UI.
 */

export function useFormatters() {
  /**
   * Converts a date only ISO format date (e.g. 2020-12-31) to a date and
   * time value at midnight in the current local time. For instance,
   * for a -7:00 timezone it would be 2020-12-31T00:00:00-07:00.
   * @param date date only string in the format YYYY-MM-YY.
   * @returns date with local time set to midnight.
   */
  const dateOnlyToLocalDateTimeString = (date: Date | string): string => {
    return dayjs(date).format();
  };
  /**
   * Get the date only part of a date/time or string.
   * @param date date/time or string to have the date extracted.
   * @returns date only string in ISO format YYYY-MM-DD.
   */
  const getISODateOnlyString = (date: Date | string): string => {
    return dayjs(date).format(DATE_ONLY_ISO_FORMAT);
  };
  /**
   * Convert a string or date to a string format like "Aug 05 2021".
   * @param date string or date to be converted.
   * @returns string representation (e.g. Aug 05 2021).
   */
  const dateOnlyLongString = (date?: string | Date): string => {
    if (date) {
      return dayjs(date).format("MMM DD YYYY");
    }
    return "";
  };

  /**
   * Extract time from any given date in HH:mm format.
   * @param date
   * @returns Formatted time.
   */
  const timeOnlyInHoursAndMinutes = (date: string | Date): string => {
    if (date) {
      return dayjs(date).format("HH:mm");
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

  const getFormattedAddress = (address: Address): string => {
    const formattedAddress: string[] = [];
    formattedAddress.push(address.addressLine1);
    if (address.addressLine2) {
      formattedAddress.push(address.addressLine2);
    }
    formattedAddress.push(address.city);
    if (address.provinceState) {
      formattedAddress.push(address.provinceState);
    }
    formattedAddress.push(address.postalCode);
    formattedAddress.push(address.country);
    return formattedAddress.join(", ");
  };

  const parseSINValidStatus = (data?: boolean): SINValidStatus => {
    if (data === null) {
      return {
        sinStatus: SINStatusEnum.PENDING,
        severity: "warn",
        message: PENDING_SIN_MESSAGE,
      };
    } else if (data === false) {
      return {
        sinStatus: SINStatusEnum.INVALID,
        severity: "error",
        message: INVALID_SIN_MESSAGE,
      };
    }
    return {
      sinStatus: SINStatusEnum.VALID,
      severity: "",
      message: "",
    };
  };

  /**
   * Converts a string flag defined as Y/N to Yes/No.
   * @param yesNoFlag Y/N flag.
   * @returns Yes, No or a default empty value case not a expected flag value as Y or N.
   */
  const yesNoFlagDescription = (yesNoFlag?: string): string => {
    if (!yesNoFlag) {
      return DEFAULT_EMPTY_VALUE;
    }
    const flagMapper = { y: "Yes", n: "No" };
    return flagMapper[yesNoFlag.toLowerCase()] || DEFAULT_EMPTY_VALUE;
  };

  /**
   * Converts a boolean to a Yes/No description value.
   * @param boolValue value to be converted to Yes/No.
   * @returns Yes, No or a default empty value case not a expected flag value as Y or N.
   */
  const booleanToYesNo = (boolValue?: boolean): string => {
    if (boolValue === true) {
      return "Yes";
    }
    if (boolValue === false) {
      return "No";
    }
    return DEFAULT_EMPTY_VALUE;
  };

  /**
   * Converts a SIN to the format 999 999 999.
   * @param sin value to be converted to be displayed.
   * @returns SIN formatted as 999 999 999.
   */
  const sinDisplayFormat = (sin: string): string | undefined => {
    if (!sin) {
      return DEFAULT_EMPTY_VALUE;
    }
    // 9 is the expected length for a SIN.
    if (sin?.length !== 9) {
      return sin;
    }
    return (
      sin.substring(0, 3) +
      " " +
      sin.substring(3, 6) +
      " " +
      sin.substring(6, 9)
    );
  };

  /**
   * Convert the user role in the expected format to be displayed.
   * @param institutionUserRole institution user role.
   * @returns user role in the expected format to be displayed.
   */
  const institutionUserRoleToDisplay = (
    institutionUserRole: InstitutionUserRoles,
  ): string => {
    if (institutionUserRole === InstitutionUserRoles.legalSigningAuthority) {
      return "Legal signing authority";
    }
    return institutionUserRole;
  };

  return {
    dateOnlyLongString,
    dateOnlyToLocalDateTimeString,
    getDatesDiff,
    getFormattedAddress,
    timeOnlyInHoursAndMinutes,
    parseSINValidStatus,
    yesNoFlagDescription,
    booleanToYesNo,
    sinDisplayFormat,
    getISODateOnlyString,
    institutionUserRoleToDisplay,
  };
}
