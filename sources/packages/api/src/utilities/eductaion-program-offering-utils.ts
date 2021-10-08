import { EducationProgramOffering } from "../database/entities";
import { dateString } from ".";

/**
 * Gets Offering name with study start and end date.
 * @param offering offering object.
 * @returns offering name with study start and end date.
 */
export function getOfferingNameAndPeriod(
  offering: Partial<EducationProgramOffering>,
): string {
  return `${offering.name} (${dateString(
    offering.studyStartDate,
  )} - ${dateString(offering.studyEndDate)})`;
}
