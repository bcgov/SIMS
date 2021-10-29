import { OfferingIntensity } from "../database/entities";

/**
 * Gets the marital status code conversion for the MSFAA request file
 */
export function getMaritalStatusCode(maritalStatus: string): string {
  if (maritalStatus === "married") {
    return "M";
  }
  return maritalStatus === "single" ? "S" : "O";
}

/**
 * Gets the gender code conversion for the MSFAA request file
 */

export function getGenderCode(gender: string): string {
  if (gender === "male") {
    return "M";
  }
  return gender === "female" ? "F" : "O";
}

/**
 * Gets the offering intensity code conversion for the MSFAA request file
 */

export function getOfferingIntensityCode(offeringIntensity: string): string {
  return offeringIntensity === OfferingIntensity.fullTime ? "FT" : "PT";
}
