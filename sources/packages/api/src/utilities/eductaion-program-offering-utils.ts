import { EducationProgramOffering } from "../database/entities";
import { dateString } from ".";
import { OptionItem } from "../types";

/**
 * Gets Offering Details For the Formio Dropdown (Student application and PIR).
 * @param offerings offerings array.
 * @returns offering details needed for dropdown in OptionItem format
 */
export function getOfferingDetailsForDropdown(
  offerings: Partial<EducationProgramOffering>[],
): OptionItem[] {
  return offerings.map((offering) => ({
    id: offering.id,
    description: `${offering.name} (${dateString(
      offering.studyStartDate,
    )} - ${dateString(offering.studyEndDate)})`,
  }));
}
