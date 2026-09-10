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
  MinistryFileProcessingIssue: "cb0efb5a-7540-4925-b017-e9d96852368f",
  StudentAcceptAssessmentOverdue: "8d9fef2b-037f-4e59-aefc-61f3105a6510",
  InstitutionAddsPendingProgramNotification:
    "999e31e1-ea2d-4583-a17c-106906340266",
  InstitutionAddsPendingOfferingNotification:
    "9f0a0f79-05a6-4b81-9e71-6a85906601ef",
  FormerYouthInCareNotification: "636dd0c7-fe23-4a25-826b-03202326b580",
  SupportingUserInfoTemplateId: "46f36b94-9c14-406d-a03c-bbec618726e4",
} as const;

/**
 * Notify template IDs for the notification message types.
 * These constants are intended for use in E2E tests only.
 */
export const NOTIFY_TEMPLATE_IDS = {
  StudentAppealSubmitted: "becf1ee6-25f1-4524-9a55-2ad028232544",
  MinistryAppealCompleted: "99d5e448-aee1-4ec8-b351-f6c5b93272de",
  MinistryChangeRequestSubmitted: "34855186-715a-4046-a550-c7dfa5e26332",
  StudentChangeRequestReviewCompleted: "6aade73f-1991-4473-8e6d-e01fc9df00b2",
  MinistryFileProcessingIssue: "a82c0d03-50fb-4c45-afa8-f6217ff7e972",
  StudentAcceptAssessmentOverdue: "3fb4ad38-3b90-49ee-92eb-0780315ceaba",
  InstitutionAddsPendingProgramNotification:
    "eeba056e-fc71-4a0a-afb7-fa06aac1ec52",
  InstitutionAddsPendingOfferingNotification:
    "f42d9896-22ad-40bc-ad6e-6982bd492e93",
  FormerYouthInCareNotification: "306b1c3d-624d-4969-9a2c-a4894035c1e7",
  SupportingUserInfoTemplateId: "fd3ddc39-c9f3-4900-a810-3c0263597bf7",
} as const;
