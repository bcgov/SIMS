export enum FormSubmissionAuthRoles {
  ViewFormSubmittedData = "view-form-submitted-data",
  ViewFormHistoryList = "view-form-history-list",
  AssessItemDecision = "assess-item-decision",
  AssessFinalDecision = "assess-final-decision",
  ViewDecisionHistory = "view-decision-history",
}

export type FormSubmissionUserRoles = {
  [formRole in FormSubmissionAuthRoles]?: number[];
};

export class FormSubmissionUserRolesAuth {
  constructor(readonly formSubmissionUserRoles: FormSubmissionUserRoles) {}

  isAuthorized(
    formRole: FormSubmissionAuthRoles,
    dynamicFormConfigurationIDs: number[],
  ): boolean {
    const authorizedFormIDs = this.authorizedDynamicFormsIDs(formRole);
    return dynamicFormConfigurationIDs.every((id) =>
      authorizedFormIDs.includes(id),
    );
  }

  authorizedDynamicFormsIDs(formRole: FormSubmissionAuthRoles): number[] {
    return this.formSubmissionUserRoles[formRole] ?? [];
  }
}
