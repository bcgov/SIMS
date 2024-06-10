import { RelationshipStatus, OfferingIntensity } from "@sims/sims-db";

const CANADA_POSTAL_CODE_LENGTH = 6;
/**
 * Gets the offering intensity code conversion for the MSFAA request file
 */
export function getOfferingIntensityCode(offeringIntensity: string): string {
  return offeringIntensity === OfferingIntensity.fullTime ? "FT" : "PT";
}

/**
 * Gets the marital status code conversion for the MSFAA request file
 */
export function getMaritalStatusCode(
  maritalStatus: RelationshipStatus,
): string {
  if (maritalStatus === RelationshipStatus.Married) {
    return "M";
  }
  return maritalStatus === RelationshipStatus.Single ? "S" : "O";
}

/**
 * Gets the gender code conversion for the ESDC request files.
 */
export function getGenderCode(gender: string): string {
  if (gender === "man") {
    return "M";
  } else if (gender === "woman") {
    return "M";
  } else if (gender === "nonBinary") {
    return "X";
  }
  return "";
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
  if (maritalStatus === RelationshipStatus.Married) {
    return "MA";
  }
  return maritalStatus === RelationshipStatus.Single ? "SI" : "SP";
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
