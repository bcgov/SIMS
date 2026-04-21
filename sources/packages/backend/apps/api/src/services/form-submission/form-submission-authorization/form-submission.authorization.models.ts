export enum FormSubmissionAuthRoles {
  ViewFormSubmittedData = "view-form-submitted-data",
  ViewFormHistoryList = "view-form-history-list",
  AssessItemDecision = "assess-item-decision",
  AssessFinalDecision = "assess-final-decision",
  ViewDecisionHistory = "view-decision-history",
}

/**
 * Association between form roles and the dynamic form configuration IDs
 * that the user is authorized to access for each form role.
 */
export type FormSubmissionUserRoles = {
  [formRole in FormSubmissionAuthRoles]?: number[];
};

/**
 * Checks for the forms authorizations based on the user roles and the dynamic
 * form configurations associated with the form submission.
 */
export class FormSubmissionUserRolesAuth {
  constructor(readonly formSubmissionUserRoles: FormSubmissionUserRoles) {}

  /**
   * Check if the user is authorized to perform an action on a form submission based on their roles.
   * @param formRole form role to check authorization for.
   * @param dynamicFormConfigurationIDs list of dynamic form configuration IDs to check authorization for.
   * @param options authorization options.
   * - `atLeastOneAuthorized`: if true, the method returns true if the user is authorized for at least
   * one of the provided dynamic form configuration IDs, otherwise, the user must be authorized for all
   * provided dynamic form configuration IDs to return true.
   * @returns boolean indicating whether the user is authorized for the specified form role and
   * dynamic form configuration IDs.
   */
  isAuthorized(
    formRole: FormSubmissionAuthRoles,
    dynamicFormConfigurationIDs: number[],
    options?: { atLeastOneAuthorized?: boolean },
  ): boolean {
    const authorizedFormIDs = this.authorizedDynamicFormsIDs(formRole);
    if (options?.atLeastOneAuthorized) {
      return dynamicFormConfigurationIDs.some((id) =>
        authorizedFormIDs.includes(id),
      );
    }
    return dynamicFormConfigurationIDs.every((id) =>
      authorizedFormIDs.includes(id),
    );
  }

  /**
   * Get the list of dynamic form configuration IDs that the user is authorized to access for a specific form role.
   * Useful for database queries to filter the content based on the user authorizations.
   * @param formRole form role to check authorization for.
   * @returns list of dynamic form configuration IDs the user is authorized to access for the specified form role.
   */
  authorizedDynamicFormsIDs(formRole: FormSubmissionAuthRoles): number[] {
    return this.formSubmissionUserRoles[formRole] ?? [];
  }
}
