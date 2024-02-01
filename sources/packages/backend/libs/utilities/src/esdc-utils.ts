import { RelationshipStatus, OfferingIntensity } from "@sims/sims-db";

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
  if (gender === "male") {
    return "M";
  }
  return gender === "female" ? "F" : "O";
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
