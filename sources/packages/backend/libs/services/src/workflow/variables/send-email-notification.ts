/**
 * Free-form personalisation values provided by the workflow to be merged with
 * the personal information loaded on the API side (e.g. student given names and
 * last name) before the email is sent.
 */
export const EMAIL_NOTIFICATION_PERSONALISATION = "emailNotificationPersonalisation";
/**
 * Free-form metadata provided by the workflow used to check whether the same
 * notification was already sent, preventing duplicate emails. It defines the
 * uniqueness scope of the notification dynamically (e.g. `applicationNumber`
 * results in once per application, remaining stable across application edits).
 * When empty or not provided, the existence check is skipped and the email is
 * always sent.
 */
export const EMAIL_NOTIFICATION_CHECK_METADATA = "emailNotificationCheckMetadata";
