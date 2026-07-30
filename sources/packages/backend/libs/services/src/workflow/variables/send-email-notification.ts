/**
 * Personalisation context provided by the workflow, mapping each GC Notify
 * personalisation variable name to the path of the value to be resolved from
 * the notification data loaded on the API side (e.g. `studentGivenNames`).
 */
export const PERSONALISATION = "personalisation";
/**
 * Free-form metadata provided by the workflow used to check whether the same
 * notification was already sent, preventing duplicate emails. It defines the
 * uniqueness scope of the notification dynamically (e.g. `parentApplicationId`
 * results in once per application, remaining stable across application edits).
 * When empty or not provided, the existence check is skipped and the email is
 * always sent.
 */
export const METADATA = "metadata";
