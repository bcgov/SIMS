import {
  INVALID_SIN_MESSAGE,
  PENDING_SIN_MESSAGE,
} from "@/constants/message-constants";
import { SINValidStatus } from "@/store/modules/student/student";
import {
  Address,
  DisabilityStatus,
  DisabilityStatusViewType,
  InstitutionUserRoles,
  SINStatusEnum,
} from "@/types";
import dayjs, { QUnitType, OpUnitType } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import utc from "dayjs/plugin/utc";

dayjs.extend(customParseFormat);
dayjs.extend(utc);

const DEFAULT_EMPTY_VALUE = "-";
export const DATE_ONLY_ISO_FORMAT = "YYYY-MM-DD";
export const DATE_HOUR_MINUTE_ISO_FORMAT = "MMM DD YYYY HH:mm";

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
   * Get the date hour and minute of a date/time or string.
   * @param date date/time or string to have the date extracted.
   * @returns date only string in ISO format YYYY-MM-DD, if a date is provided.
   */
  const getISODateHourMinuteString = (
    date?: Date | string,
  ): string | undefined => {
    if (date) {
      return dayjs(date).format(DATE_HOUR_MINUTE_ISO_FORMAT);
    }
    return undefined;
  };

  /**
   * Convert a string or date to a string format like "Aug 05 2021".
   * @param date string or date to be converted.
   * @param format specific date string format expected. If the format
   * is not the expected it will convert the date as as 'Invalid Date'.
   * @param strict requires that the format and input match exactly,
   * including delimiters.
   * @returns string representation (e.g. Aug 05 2021).
   */
  const dateOnlyLongString = (
    date?: string | Date,
    format?: string,
    strict?: boolean,
  ): string => {
    if (date) {
      return dayjs(date, format, strict).format("MMM DD YYYY");
    }
    return "";
  };

  /**
   * Converts a start and end dates to a string format like "Aug 05 2021 - Dec 12 2021".
   * @param startDate start period date to be converted.
   * @param endDate end period date to be converted.
   * @param format specific date string format expected. If the format
   * is not the expected it will convert the date as as 'Invalid Date'.
   * @param strict requires that the format and input match exactly,
   * including delimiters.
   * @returns string representation (e.g. Aug 05 2021 - Dec 12 2021).
   */
  const dateOnlyLongPeriodString = (
    startDate?: string | Date,
    endDate?: string | Date,
    format?: string,
    strict?: boolean,
  ): string => {
    if (startDate && endDate) {
      return `${dateOnlyLongString(
        startDate,
        format,
        strict,
      )} - ${dateOnlyLongString(endDate, format, strict)}`;
    }
    return DEFAULT_EMPTY_VALUE;
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

  /**
   * Format an address in the expected order where each expected
   * address component represents an entry in the array.
   * @param address address to be formatted.
   * @returns string array with ordered address components.
   * @example
   * [
   *   "Address Line 1"
   *   "Address Line 2"
   *   "City, Province, Postal Code"
   *   "Country"
   * ]
   */
  const getFormattedAddressList = (address: Address): string[] => {
    const formattedAddress: string[] = [];
    // Address line 1
    formattedAddress.push(address.addressLine1);
    if (address.addressLine2) {
      // Address line 2
      formattedAddress.push(address.addressLine2);
    }
    // City, province, and postal code.
    const cityPostalCountry: string[] = [];
    cityPostalCountry.push(address.city);
    if (address.provinceState) {
      cityPostalCountry.push(address.provinceState);
    }
    cityPostalCountry.push(address.postalCode);
    formattedAddress.push(cityPostalCountry.join(", "));
    // Country.
    formattedAddress.push(address.country);
    return formattedAddress;
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
   * Converts an empty or null string to '-', else return the actual string.
   * @param value string.
   * @returns '-' or the actual string.
   */
  const emptyStringFiller = (value?: string): string => {
    return value ? value : DEFAULT_EMPTY_VALUE;
  };

  /**
   * Converts an empty or null string to '-', else return the actual string if the 'condition' is true.
   * @param value string.
   * @param condition expression
   * @returns '-' or the actual string.
   */
  const conditionalEmptyStringFiller = (
    condition: boolean,
    value?: string,
  ): string => {
    if (condition) {
      return emptyStringFiller(value);
    }
    return DEFAULT_EMPTY_VALUE;
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
   * Converts the saved gender to the capitalized display version.
   * @param gender value to be converted to be displayed.
   * @returns formatted gender string.
   */
  const genderDisplayFormat = (gender: string): string => {
    switch (gender) {
      case "man":
        return "Man";
      case "woman":
        return "Woman";
      case "nonBinary":
        return "Non-Binary";
      default:
        return "Prefer Not To Answer";
    }
  };

  /**
   * Converts a SIN to the format 999 999 999.
   * @param sin value to be converted to be displayed.
   * @returns SIN formatted as 999 999 999.
   */
  const sinDisplayFormat = (sin?: string): string | undefined => {
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

  /**
   * Format a currency value including negative currency value.
   * @param moneyAmount value amount.
   * @param currencyCode currency code.
   * @param defaultValueAmount default value to display
   * when value is not provided or zero.
   * @returns formatted currency value.
   */
  const formatCurrency = (moneyAmount: number | string): string => {
    if (moneyAmount === null || moneyAmount === undefined) {
      moneyAmount = 0;
    }
    const currencyValue = parseFloat(moneyAmount.toString());
    const negativeValueDisplay = currencyValue < 0 ? "-" : "";
    return `${negativeValueDisplay}$${Math.abs(currencyValue).toFixed(2)}`;
  };

  /**
   * Validates if the given date 1 is before the given date 2.
   * The comparison is only done with dates, if the date has a
   * time object it's not considered for the comparison only date
   * is considered.
   * @param date1 given date 1.
   * @param date2 given date 2.
   * @returns if the given date 1 is before the given date 2.
   */
  const isBeforeDateOnly = (
    date1: string | Date,
    date2: string | Date,
  ): boolean => {
    return dayjs(dayjs(date1).format("YYYY-MM-DD")).isBefore(
      dayjs(date2).format("YYYY-MM-DD"),
    );
  };

  /**
   * Converts a undefined or NaN number as empty string or default value.
   * @param value number need to be converted.
   * @param defaultValue optional default value returned in case number is not valid.
   * @returns number, default value or empty string.
   */
  const numberEmptyFiller = (
    value: number,
    defaultValue = "",
  ): number | string => {
    return !value || Number.isNaN(value) ? defaultValue : value;
  };

  /**
   * Convert the disability status to be displayed
   * in an equivalent user friendly description.
   * @param disabilityStatus disability status.
   * @returns user friendly disability status.
   */
  const disabilityStatusToDisplay = (
    disabilityStatus: DisabilityStatus,
  ): DisabilityStatusViewType | DisabilityStatus => {
    switch (disabilityStatus) {
      case DisabilityStatus.PD:
        return DisabilityStatusViewType.PD;
      case DisabilityStatus.PPD:
        return DisabilityStatusViewType.PPD;
      default:
        return disabilityStatus;
    }
  };

  /**
   * Convert the application disability status to be displayed
   * in an equivalent user friendly description.
   * @param applicationDisabilityStatus application disability status.
   * @returns user friendly application disability status.
   */
  const applicationDisabilityStatusToDisplay = (
    applicationDisabilityStatus: string,
  ): string => {
    if (applicationDisabilityStatus === "yes") {
      return "Assessment includes disability funding types.";
    }
    return "No disability funding types included on assessment.";
  };

  /**
   * Formats a money value as a currency value.
   * @param value money value to be formatted.
   * @param placeholder placeholder to be used in case value is not provided.
   * @returns the formatted money value.
   */
  const currencyFormatter = (value: unknown, placeholder = ""): string => {
    if (typeof value === "number") {
      return new Intl.NumberFormat("en-CA", {
        style: "currency",
        currency: "CAD",
        roundingMode: "trunc",
      }).format(value);
    }
    return placeholder;
  };

  return {
    dateOnlyLongString,
    dateOnlyLongPeriodString,
    dateOnlyToLocalDateTimeString,
    getDatesDiff,
    getFormattedAddress,
    getFormattedAddressList,
    genderDisplayFormat,
    timeOnlyInHoursAndMinutes,
    parseSINValidStatus,
    yesNoFlagDescription,
    booleanToYesNo,
    sinDisplayFormat,
    getISODateOnlyString,
    getISODateHourMinuteString,
    institutionUserRoleToDisplay,
    emptyStringFiller,
    numberEmptyFiller,
    conditionalEmptyStringFiller,
    formatCurrency,
    isBeforeDateOnly,
    disabilityStatusToDisplay,
    applicationDisabilityStatusToDisplay,
    currencyFormatter,
  };
}
