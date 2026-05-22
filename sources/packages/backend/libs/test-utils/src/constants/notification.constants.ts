/**
 * GC Notify template IDs for the notification message types related to
 * appeals and change requests, seeded in the database during migrations.
 * These constants are intended for use in E2E tests only.
 */
export const GC_NOTIFY_TEMPLATE_IDS = {
  StudentAppealSubmitted: "241a360a-07d6-486f-9aa4-fae6903e1cff",
  MinistryAppealCompleted: "d78624da-c0f3-4bf7-8508-e311a50cfead",
  MinistryChangeRequestSubmitted: "fad81016-0bed-4d4e-ad48-f70cc943399c",
  StudentChangeRequestReviewCompleted: "9a4855d1-4f9a-4293-9868-cd853a8e4061",
  MinistryFormSubmitted: "296aa2ea-dfa7-4285-9d5b-315b2a4911d6",
  StudentFormCompleted: "fed6b26e-d1f2-4a8c-bfe5-5cb66c00458b",
  InstitutionAddsPendingProgramNotification:
    "98b38e6b-a015-48e8-8058-1e21402bb1b6",
  InstitutionAddsPendingOfferingNotification:
    "b4e6252b-e196-4c14-9a29-1b2a71e9131a",
} as const;
