import {
  DynamicFormType,
  EducationProgramOffering,
  ProgramYear,
  SupportingUserType,
} from "@sims/sims-db";
import { isBetweenPeriod } from "@sims/utilities";

/**
 * Get supporting user dynamic form type.
 * @param userType supporting user type.
 * @returns supporting user form type.
 */
export function getSupportingUserFormType(
  userType: SupportingUserType,
): DynamicFormType {
  switch (userType) {
    case SupportingUserType.Parent:
      return DynamicFormType.SupportingUsersParent;
    case SupportingUserType.Partner:
      return DynamicFormType.SupportingUsersPartner;
    default:
      throw new Error(`Unknown supporting user type: ${userType}`);
  }
}

/**
 * Check if the offering belong to the program year.
 * @param offering offering details.
 * @param programYear program year details.
 * @returns returns true if the offering belong to the program
 * year.
 */
export function offeringBelongToProgramYear(
  offering: Pick<EducationProgramOffering, "studyStartDate">,
  programYear: Pick<ProgramYear, "startDate" | "endDate">,
): boolean {
  // Check if the program start date belong to the program year.
  return isBetweenPeriod(offering.studyStartDate, programYear);
}

/**
 * Check if a program year allows a change request.
 * @param programYear program year entity model to be checked.
 * @returns true if the program year allows a change request, false otherwise.
 */
export function allowApplicationChangeRequest(
  programYear: Pick<ProgramYear, "programYear">,
): boolean {
  // Existing program years that are not allowed to submit change request.
  // This will allow any program year from 2025-2026 and beyond to submit.
  // Once the change request is allowed for all program years, this function
  // should be removed.
  return !["2021-2022", "2022-2023", "2023-2024", "2024-2025"].includes(
    programYear.programYear,
  );
}
