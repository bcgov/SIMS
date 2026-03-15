/**
 * Notification form type category labels used in ministry form submitted notifications
 * to classify the type of form or appeal being submitted.
 */
export const NOTIFICATION_FORM_TYPE = {
  ApplicationAppeal: "Application appeal",
  OtherAppeal: "Other appeal",
  StandardForm: "Standard form",
} as const;

/**
 * GC Notify template IDs for the notification message types related to
 * appeals and change requests, seeded in the database during migrations.
 */
export const GC_NOTIFY_TEMPLATE_IDS = {
  MinistryChangeRequestSubmitted: "fad81016-0bed-4d4e-ad48-f70cc943399c",
  StudentChangeRequestReviewCompleted: "9a4855d1-4f9a-4293-9868-cd853a8e4061",
  MinistryFormSubmitted: "296aa2ea-dfa7-4285-9d5b-315b2a4911d6",
  StudentFormCompleted: "fed6b26e-d1f2-4a8c-bfe5-5cb66c00458b",
} as const;
