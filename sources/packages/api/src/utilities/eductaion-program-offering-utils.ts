import { EducationProgramOffering } from "../database/entities";
import { dateString } from ".";

/**
 * Utility to get year of study label.
 * @param yearId
 * @returns Year of Study label
 */
export const getYearOfStudyLabel = (yearId: number): string => {
  const yearOfStudy = [
    "Year 1",
    "Year 2",
    "Year 3",
    "Year 4",
    "Year 5",
    "Year 6",
    "Year 7",
    "Year 8",
    "Year 9",
  ];
  return yearOfStudy[yearId - 1];
};

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
  )} - ${dateString(offering.studyEndDate)})${
    offering.showYrOfStudy
      ? " - " + getYearOfStudyLabel(offering.yearOfStudy)
      : ""
  }`;
}
