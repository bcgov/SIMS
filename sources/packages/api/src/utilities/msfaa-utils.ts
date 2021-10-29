import { OfferingIntensity } from "src/database/entities";

/**
 * Gets the marital status code conversion for the MSFAA request file
 */
export function getMaritalStatusCode(maritalStatus: string): string {
  return maritalStatus === "married"
    ? "M"
    : maritalStatus === "single"
    ? "S"
    : "O";
}

/**
 * Gets the gender code conversion for the MSFAA request file
 */

export function getGenderCode(gender: string): string {
  return gender === "male" ? "M" : gender === "female" ? "F" : "O";
}

/**
 * Gets the offering intensity code conversion for the MSFAA request file
 */

export function getOfferingIntensityCode(offeringIntensity: string): string {
  return offeringIntensity === OfferingIntensity.fullTime ? "FT" : "PT";
}
