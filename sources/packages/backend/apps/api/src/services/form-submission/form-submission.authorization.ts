import { FormCategory } from "@sims/sims-db";
import { Role } from "../../auth";

/**
 * Allowed role to update a form submission item based on the form category.
 */
export const FORM_SUBMISSION_APPROVAL_ROLES_MAP = new Map<FormCategory, Role>([
  [FormCategory.StudentAppeal, Role.StudentApproveDeclineAppeals],
  [FormCategory.StudentForm, Role.StudentApproveDeclineForms],
]);

/**
 * Indicates if the form submission item can be updated by the user based on the form category and user roles.
 * @param category The category of the form item being updated, used
 * to determine the required role for authorization.
 * @param userRoles The roles of the user attempting to perform the action.
 * @returns true if the user has the required role for the form category, false otherwise.
 */
export function hasFormSubmissionApprovalAuthorization(
  category: FormCategory,
  userRoles?: Role[],
): boolean {
  if (!userRoles?.length) {
    return false;
  }
  const allowedRole = FORM_SUBMISSION_APPROVAL_ROLES_MAP.get(category);
  return allowedRole ? userRoles.includes(allowedRole) : false;
}
