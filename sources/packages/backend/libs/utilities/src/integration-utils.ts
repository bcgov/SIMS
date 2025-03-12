import { DisabilityStatus } from "@sims/sims-db";

/**
 * Express the completion years data present on educational programs as
 * an amount of years.
 * * This information is not supposed to be relevant enough to stop a
 * * disbursement to happen if not accurate.
 */
export function getTotalYearsOfStudy(completionYears: string): number {
  switch (completionYears) {
    case "12WeeksTo52Weeks":
    case "53WeeksTo59Weeks":
      return 1;
    case "60WeeksToLessThan2Years":
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

export function getStudentDisabilityStatusCode(
  disabilityStatus: DisabilityStatus,
) {
  switch (disabilityStatus) {
    case DisabilityStatus.NotRequested:
      return "NONE";
    case DisabilityStatus.Requested:
      return "PDRQ";
    case DisabilityStatus.PD:
      return "Approved for Permanent Disability";
    case DisabilityStatus.PPD:
      return "Approved for Persistent or Prolonged Disability";
  }
}
