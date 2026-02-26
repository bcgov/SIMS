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
 *  * There is already a form submission pending a decision for the same context.
 */
export const FORM_SUBMISSION_PENDING_DECISION =
  "FORM_SUBMISSION_PENDING_DECISION";
/**
 * The form submission with the specified ID was not found.
 */
export const FORM_SUBMISSION_NOT_FOUND = "FORM_SUBMISSION_NOT_FOUND";
/**
 * A final decision cannot be made on a form submission when some
 * decisions on the form items are still pending.
 */
export const FORM_SUBMISSION_DECISION_PENDING =
  "FORM_SUBMISSION_DECISION_PENDING";
/**
 * The form submission item with the specified ID was not found.
 */
export const FORM_SUBMISSION_ITEM_NOT_FOUND = "FORM_SUBMISSION_ITEM_NOT_FOUND";
/**
 * A decision cannot be saved on a form submission item when its parent submission is not in pending status.
 */
export const FORM_SUBMISSION_NOT_PENDING = "FORM_SUBMISSION_NOT_PENDING";
/**
 * A more updated decision was saved since the form submission item was last retrieved for decision,
 * and the decision cannot be saved based on potentially outdated information.
 */
export const FORM_SUBMISSION_ITEM_OUTDATED = "FORM_SUBMISSION_ITEM_OUTDATED";

/**
 * User is not authorized to update a form submission related data.
 */
export const FORM_SUBMISSION_UPDATE_UNAUTHORIZED =
  "FORM_SUBMISSION_UPDATE_UNAUTHORIZED";
