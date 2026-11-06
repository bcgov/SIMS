import { RelationshipStatus, OfferingIntensity } from "@sims/sims-db";

const CANADA_POSTAL_CODE_LENGTH = 6;
/**
 * Decimal character places for the 99V9(4) format.
 * example: value = 012345, decimalPlaces = 4 => returns 01.2345
 */
export const DECIMAL_PLACES_99V94 = 4;

/**
 * Decimal character places for the 9V9(4) format.
 * example: value = 01234, decimalPlaces = 4 => returns 0.1234
 */
export const DECIMAL_PLACES_9V94 = 4;

/**
 * Decimal character places for the 9(6)V99 format.
 * example: value = 12345678, decimalPlaces = 2 => returns 123456.78
 */
export const DECIMAL_PLACES_96V99 = 2;

/**
 * Decimal character places for the 9(5)V99 format.
 * example: value = 0123456, decimalPlaces = 2 => returns 01234.56
 */
export const DECIMAL_PLACES_95V99 = 2;

/**
 * Gets the offering intensity code conversion for the MSFAA request file
 */
export function getOfferingIntensityCode(offeringIntensity: string): string {
  return offeringIntensity === OfferingIntensity.fullTime ? "FT" : "PT";
}

/**
 * Gets the marital status code conversion for the MSFAA request file.
 */
export function getMaritalStatusCode(
  maritalStatus: RelationshipStatus,
): string {
  switch (maritalStatus) {
    case RelationshipStatus.Single:
      return "S";
    case RelationshipStatus.Married:
    case RelationshipStatus.MarriedUnable:
      return "M";
    default:
      return "O";
  }
}

/**
 * Gets the gender code conversion for the ESDC request files.
 */
export function getGenderCode(gender: string): string {
  switch (gender) {
    case "man":
      return "M";
    case "woman":
      return "F";
    case "nonBinary":
      return "X";
    default:
      // Gender should have at least one character code.
      // The default option as an empty space would represent
      // the "Prefer not to answer"(preferNotToAnswer) option.
      return " ";
  }
}

/**
 * Returns phone number keeping only digits 0 to 9.
 * @param phone phone number to be formatted.
 * @returns the phone number (Eg: +1 (788) 999-7777 => 17889997777).
 */
export function getFormattedPhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Gets the Part-Time marital status code conversion for the MSFAA request file.
 */
export function getPartTimeMaritalStatusCode(
  maritalStatus: RelationshipStatus,
): string {
  switch (maritalStatus) {
    case RelationshipStatus.Single:
      return "SI";
    case RelationshipStatus.Married:
    case RelationshipStatus.MarriedUnable:
      return "MA";
    default:
      return "SP";
  }
}

/**
 * Get the e-Cert flag for the borrower's calculated disability status.
 * @param calculatedPPDStatus indicates if a borrower has a disability.
 * @returns "Y" or "N" flag.
 */
export function getPPDFlag(calculatedPPDStatus: boolean): string {
  return calculatedPPDStatus ? "Y" : "N";
}

/**
 * Return specific country code for Canada. For any other
 * country just return the country as provided.
 * @param country country name.
 * @returns expected country for ESDC files.
 */
export function getCountryCode(country: string): string {
  if (country.toUpperCase() === "CANADA") {
    return "CAN";
  }
  return country;
}

/**
 * Returns a formatted postal code `A#A #A#` only for Canada addresses.
 * @param country country for the address.
 * @param postalCode postal code to be formatted.
 * @returns a formatted postal code.
 */
export function getFormattedPostalCode(
  country: string,
  postalCode: string,
): string {
  if (
    country.toUpperCase() === "CANADA" &&
    postalCode?.length === CANADA_POSTAL_CODE_LENGTH
  ) {
    const postalCodeCharArray = [...postalCode];
    postalCodeCharArray.splice(3, 0, " ");
    return postalCodeCharArray.join("");
  }
  return postalCode;
}

/**
 * Parse a number string which is combined with decimal places.
 * example: value = 12345, decimalPlaces = 2 => returns 123.45
 * These combined formats are COBOL PIC format notation as per the
 * definition provided in the integration documentation.
 * @param value the numeric value to be parsed.
 * @param decimalPlaces the number of decimal places to divide by.
 * @returns the parsed decimal value.
 */
export function parseCombinedDecimalString(
  value: number,
  decimalPlaces: number,
): number {
  if (Number.isNaN(value)) {
    throw new Error("Invalid number: NaN");
  }
  return value / 10 ** decimalPlaces;
}
