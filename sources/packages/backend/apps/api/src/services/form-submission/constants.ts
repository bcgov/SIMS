/**
 * An expected form configuration was not found for one or more forms in the submission.
 */
export const FORM_SUBMISSION_UNKNOWN_FORM_CONFIGURATION =
  "FORM_SUBMISSION_UNKNOWN_FORM_CONFIGURATION";
/**
 * The submission contains more than one form item, but at least one
 * of the forms does not have the same application scope.
 */
export const FORM_SUBMISSION_MIXED_FORM_APPLICATION_SCOPE =
  "FORM_SUBMISSION_MIXED_FORM_APPLICATION_SCOPE";
/**
 * The submission contains application scoped forms, but the application ID is missing.
 */
export const FORM_SUBMISSION_APPLICATION_SCOPE_MISSING_APPLICATION_ID =
  "FORM_SUBMISSION_APPLICATION_SCOPE_MISSING_APPLICATION_ID";
/**
 * The submission contains more than one form item, but at least one
 * of the forms does not allow bundled submission.
 */
export const FORM_SUBMISSION_BUNDLED_SUBMISSION_FORMS_NOT_ALLOWED =
  "FORM_SUBMISSION_BUNDLED_SUBMISSION_FORMS_NOT_ALLOWED";
/**
 * The submission contains more than one form item, but at least one
 * of the forms does not share the same form category.
 */
export const FORM_SUBMISSION_MIXED_FORM_CATEGORIES =
  "FORM_SUBMISSION_MIXED_FORM_CATEGORIES";
/**
 * The submission contains invalid dynamic data (form.io dry run failed).
 */
export const FORM_SUBMISSION_INVALID_DYNAMIC_DATA =
  "FORM_SUBMISSION_INVALID_DYNAMIC_DATA";
/**
 * There is already a form submission pending a decision for the same context.
 */
export const FORM_SUBMISSION_PENDING_DECISION =
  "FORM_SUBMISSION_PENDING_DECISION";
