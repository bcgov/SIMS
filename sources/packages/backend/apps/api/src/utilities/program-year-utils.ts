import {
  EducationProgramOffering,
  ProgramYear,
  SupportingUserType,
} from "@sims/sims-db";
import { isBetweenPeriod } from "@sims/utilities";

/**
 * Define the form name to be used from a program year based
 * on the supporting user type.
 * @param userType supporting user type.
 * @param programYear program year object that contains the form
 * definition name for every supporting user type.
 * @returns supporting user form name.
 */
export function getSupportingUserForm(
  userType: SupportingUserType,
  programYear: Pick<ProgramYear, "parentFormName" | "partnerFormName">,
): string {
  switch (userType) {
    case SupportingUserType.Parent:
      return programYear.parentFormName;
    case SupportingUserType.Partner:
      return programYear.partnerFormName;
    default:
      throw new Error(`Unknown supporting user type: ${userType}`);
  }
}

/**
 * Check if the offering belong to the program year.
 * @param newOffering offering details.
 * @param programYear program year details.
 * @returns returns true if the offering belong to the program
 * year.
 */
export function offeringBelongToProgramYear(
  newOffering: EducationProgramOffering,
  programYear: ProgramYear,
): boolean {
  // Check if the program start start belong to the program year.
  return isBetweenPeriod(newOffering.studyStartDate, programYear);
}
