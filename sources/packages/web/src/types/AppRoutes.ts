export enum AppRoutes {
  // Student
  StudentRoot = "/student",
  StudentDashboard = "dashboard",
  StartStudentApplication = "application-form/start",
  StudentApplication = "application-form/:selectedForm/programYear/:programYearId/application/:id",
  StudentApplicationView = "application-form/:selectedForm/programYear/:programYearId/application/:id/:readOnly",
  StudentApplicationSummary = "my-application-summary",
  StudentFileUploader = "file-uploader",
  StudentApplicationDetails = "application/:id",
  Assessment = "application/:applicationId/assessment/:assessmentId",
  RequestChange = "request-change",
  StudentAccountActivity = "student-account-activity",
  StudentOverawardsBalance = "student-overawards-balance",
  StudentAccountApplicationIsProgress = "student-account-application-in-progress",
  StudentAssessmentAwardView = "application/:applicationId/assessment-award-details/:assessmentId",
  StudentAppealRequests = "application/:applicationId/appeal/:appealId",
  StudentApplicationOfferingChangeRequest = "application/:applicationId/application-offering-change-request/:applicationOfferingChangeRequestId",
  StudentRequestedApplicationOfferingDetails = "requested-offering",
  StudentActiveApplicationOfferingDetails = "active-offering",
  InvalidBetaUser = "login/invalid-beta-user",
  // Institution
  InstitutionRoot = "/institution",
  InstitutionDashboard = "dashboard",
  InstitutionStudentSearch = "student-search",
  InstitutionProfile = "institution-profile",
  InstitutionCreate = "institution-create",
  InstitutionUserProfile = "institution-user-profile",
  InstitutionProfileEdit = "institution-profile/edit",
  InstitutionManageLocations = "manage-locations",
  AddInstitutionLocation = "add-institution-location",
  EditInstitutionLocation = "edit-institution-location",
  LocationPrograms = "location-programs/location/:locationId",
  LocationProgramsView = "location-programs/location/:locationId/program-view/:programId",
  LocationProgramsCreate = "location-programs/location/:locationId/program-create",
  LocationProgramsEdit = "location-programs/location/:locationId/program-edit/:programId",
  LocationOfferings = "location-offerings/location/:locationId/education-program/:programId",
  LocationOfferingsEdit = "location-offerings/location/:locationId/education-program/:programId/offering/:offeringId",
  LocationOfferingsView = "location-offerings/location/:locationId/education-program/:programId/offering/:offeringId/view",
  LocationOfferingsRequestChange = "location-offerings/location/:locationId/education-program/:programId/offering/:offeringId/request-change",
  LocationProgramsOfferingsCreate = "location-offerings/location/:locationId/education-program/:programId/create",
  LocationUsers = "location-users/",
  ActiveApplicationsSummary = "active-applications/location/:locationId/summary",
  RequestApplicationOfferingChange = "location/:locationId/application-offering-change",
  RequestApplicationOfferingChangeAvailableToChange = "available",
  RequestApplicationOfferingChangeInProgress = "in-progress",
  RequestApplicationOfferingChangeCompleted = "completed",
  RequestApplicationOfferingChangeSubmit = "location/:locationId/application/:applicationId/application-offering-change/submit",
  RequestApplicationOfferingChangeView = "location/:locationId/application-offering-change/:applicationOfferingChangeRequestId",
  ActiveApplicationEdit = "active-applications/location/:locationId/application/:applicationId",
  LocationProgramInfoRequestSummary = "program-info-request/location/:locationId/summary",
  LocationCOESummary = "confirmation-of-enrollment/location/:locationId/summary",
  LocationCOEDetails = "confirmation-of-enrollment/location/:locationId/disbursement/:disbursementScheduleId",
  LocationProgramInfoRequestEdit = "program-info-request/location/:locationId/application/:applicationId",
  ManageInstitutionDesignation = "manage-designation",
  DesignationRequest = "manage-designation/request",
  DesignationView = "manage-designation/view/:designationAgreementId",
  InstitutionManageUsers = "manage-users",
  ActiveApplicationScholasticStandingView = "active-application/location/:locationId/scholastic-standing/:scholasticStandingId",
  OfferingsUpload = "offerings-upload",
  WithdrawalUpload = "withdrawal-upload",
  // AEST
  AESTRoot = "/ministry",
  AESTDashboard = "dashboard",
  SearchStudents = "search-students",
  ProgramDetail = "institution/:institutionId/location/:locationId/program-detail/:programId",
  SearchInstitutions = "search-institutions",
  InstitutionDetail = "institution-detail/:institutionId",
  AESTEditInstitutionLocation = "institution-location/institution/:institutionId/location/:locationId/edit",
  AESTInstitutionProfile = "institution-profile",
  AESTInstitutionProfileEdit = "institution-profile/:institutionId/edit",
  AESTInstitutionProfileCreate = "institution-profile/create",
  PendingDesignations = "institution/designation/pending",
  DesignationAESTView = "institution/designation/:designationId/institution/:institutionId?",
  ScholasticStandingView = "scholastic-standing/:scholasticStandingId",
  Exceptions = "exceptions",
  OfferingChangeRequests = "institution/offering/change-requests",
  ViewOfferingChangeRequest = "institution/offering-change-request/:offeringId/program/:programId",
  Appeals = "appeals",
  StudentAccountApplications = "student-account-applications",
  StudentAccountApplicationsApproval = "student-account-applications/:studentAccountApplicationId/approval",
  AssessmentAwardView = "assessment-award-details/:assessmentId",
  PendingApplicationOfferingChangeRequests = "institution/application-offering-change-request/in-progress",
  // program
  Programs = "programs",
  ViewProgram = "institution/:institutionId/location/:locationId/program/:programId",
  ViewOffering = "institution/:institutionId/location/:locationId/program/:programId/offering/:offeringId",
  Locations = "locations",
  Users = "users",
  Designation = "designation",
  SINManagement = "sin-management",
  CASSupplierManagement = "cas-supplier-management",
  ApplicationDetail = "student/:studentId/application/:applicationId",
  ApplicationVersionDetail = "student/:studentId/application/:applicationId/version/:applicationVersionId",
  SupportingUserDetail = "supporting-user/:supportingUserId",
  // Supporting Users
  SupportingUsersRoot = "/supporting-users",
  SupportingUsersDashboard = "dashboard",
  ParentSupportingInfo = "supporting-info/parent",
  PartnerSupportingInfo = "supporting-info/partner",
  // Shared
  Login = "login",
  DisabledUser = "login/disabled-user",
  UnknownUser = "login/unknown-user",
  ForbiddenUser = "/forbidden-user",
  NotAllowedUser = "login/not-allowed-user",
  StudentNotes = "student-notes/:studentId",
  StudentRestrictions = "student-restrictions/:studentId",
  Balances = "balances",
  StudentDetail = "student/:studentId",
  StudentProfile = "profile",
  Applications = "applications",
  Restrictions = "restrictions",
  FileUploads = "files",
  Notes = "notes",
  ApplicationView = "view",
  AssessmentSummary = "assessment-summary",
  ApplicationException = "application-exceptions/:exceptionId",
  StudentAppealRequest = "request-changes/:appealId",
  StudentAESTApplicationOfferingChangeRequest = "application-offering-change-request/:applicationOfferingChangeRequestId",
  NoticeOfAssessmentView = "assessment/:assessmentId/notice-of-assessment",
  Reports = "reports",
  ApplicationRestrictionsManagement = "application-restrictions-management",
  ApplicationStatusTracker = "application-status-tracker",
}
