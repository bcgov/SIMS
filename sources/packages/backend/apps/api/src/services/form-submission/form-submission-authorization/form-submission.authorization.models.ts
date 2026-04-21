/**
 * Form submissions roles.
 */
export enum FormSubmissionAuthRoles {
  /**
   * View the form submitted data, which includes the form items and their details.
   */
  ViewFormSubmittedData = "view-form-submitted-data",
  /**
   * View the history of form submissions, when visualized in the list format,
   * which provides a summary of each submission, and limited data.
   */
  ViewFormHistoryList = "view-form-history-list",
  /**
   * Assess the decision for a specific form item.
   * Allow a Ministry user to save decision for a individual form item.
   * The user must also have 'view-form-submitted-data' authorization to see the
   * form item details when making the decision.
   */
  AssessItemDecision = "assess-item-decision",
  /**
   * Assess the final decision for a form submission.
   * Allow a Ministry user to save the final decision for the entire form submission, which may include multiple form items.
   * The user must also have 'view-form-submitted-data' authorization to see the form item details when making the decision.
   * The user must have the authorization for all forms that are part of the submission.
   */
  AssessFinalDecision = "assess-final-decision",
  /**
   * View the history of decisions made for a form submission.
   * When multiple decisions are made for the same form submission, this roles allow the user to see the history of decisions,
   * including the past decisions and the current decision.
   */
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
    const authorizedFormIDs = this.getAuthorizedDynamicFormsIDs(formRole);
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
  getAuthorizedDynamicFormsIDs(formRole: FormSubmissionAuthRoles): number[] {
    return this.formSubmissionUserRoles[formRole] ?? [];
  }
}
