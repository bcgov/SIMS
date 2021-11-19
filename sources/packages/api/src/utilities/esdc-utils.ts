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

/**
 * Express the completion years data present on educational programs as
 * an amount of years.
 * * This information is not supposed to be relevant enough to stop a
 * * disbursement to happen if not accurate.
 */
export function getTotalYearsOfStudy(completionYears: string): number {
  switch (completionYears) {
    case "12WeeksToLessThan1Year":
      return 1;
    case "1YearToLessThan2Years":
      return 2;
    case "2YearsToLessThan3Years":
      return 3;
    case "3YearsToLessThan4Years":
      return 4;
    case "4YearsToLessThan5Years":
      return 5;
    case "5YearsOrMore":
      return 6;
    default:
      return 1;
  }
}
