import { EducationProgramOffering } from "@sims/sims-db";
import dayjs from "dayjs";

const DATE_ONLY_FORMAT = "MMM DD YYYY";

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
  const startDate = dayjs(offering.studyStartDate).format(DATE_ONLY_FORMAT);
  const endDate = dayjs(offering.studyEndDate).format(DATE_ONLY_FORMAT);
  return `${offering.name} (${startDate} - ${endDate}) - Year ${offering.yearOfStudy}`;
}
