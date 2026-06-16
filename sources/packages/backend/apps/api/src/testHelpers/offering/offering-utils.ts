import { EducationProgramOffering } from "@sims/sims-db";
import { getDateOnlyFormat } from "@sims/utilities/date-utils";

/**
 * Builds the expected offering name string for test assertions, independent
 * of the production utility {@link getOfferingNameAndPeriod}.
 * Format: "Offering Name (MMM DD YYYY - MMM DD YYYY) - Year X"
 * @param offering offering with name, studyStartDate, studyEndDate and yearOfStudy.
 * @returns formatted offering name string.
 */
export function getExpectedOfferingNameAndPeriod(
  offering: Pick<
    EducationProgramOffering,
    "name" | "studyStartDate" | "studyEndDate" | "yearOfStudy"
  >,
): string {
  const startDate = getDateOnlyFormat(offering.studyStartDate);
  const endDate = getDateOnlyFormat(offering.studyEndDate);
  return `${offering.name} (${startDate} - ${endDate}) - Year ${offering.yearOfStudy}`;
}
