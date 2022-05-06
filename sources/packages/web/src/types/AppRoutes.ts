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
  // Institution
  InstitutionRoot = "/institution",
  InstitutionDashboard = "dashboard",
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
  LocationProgramsOfferingsCreate = "location-offerings/location/:locationId/education-program/:programId/create",
  LocationUsers = "location-users/",
  ActiveApplicationsSummary = "active-applications/location/:locationId/summary",
  ActiveApplicationEdit = "active-applications/location/:locationId/application/:applicationId",
  LocationProgramInfoRequestSummary = "program-info-request/location/:locationId/summary",
  LocationCOESummary = "confirmation-of-enrollment/location/:locationId/summary",
  LocationCOEDetails = "confirmation-of-enrollment/location/:locationId/disbursement/:disbursementScheduleId",
  LocationProgramInfoRequestEdit = "program-info-request/location/:locationId/application/:applicationId",
  ManageInstitutionDesignation = "manage-designation",
  DesignationRequest = "manage-designation/request",
  DesignationView = "manage-designation/view/:designationAgreementId",
  InstitutionManageUsers = "manage-users",
  // AEST
  AESTRoot = "/aest",
  AESTDashboard = "dashboard",
  SearchStudents = "search-students",
  StudentDetail = "student-detail/:studentId",
  ProgramDetail = "institution/:institutionId/location/:locationId/program-detail/:programId",
  SearchInstitutions = "search-institutions",
  InstitutionDetail = "institution-detail/:institutionId",
  AESTStudentProfile = "student-profile",
  AESTEditInstitutionLocation = "edit-institution-location",
  AESTInstitutionProfile = "institution-profile",
  AESTInstitutionProfileEdit = "institution-profile/:institutionId/edit",
  PendingDesignations = "institution/designation/pending",
  DesignationAESTView = "institution/designation/:designationId/institution/:institutionId?",
  AssessmentSummary = "assessment-summary",
  StudentAppealRequestsApproval = "request-changes/:appealId",
  NoticeOfAssessmentView = "notice-of-assessment/:assessmentId",
  // program
  Programs = "programs",
  ViewProgram = "institution/:institutionId/location/:locationId/program/:programId",
  ViewOffering = "institution/:institutionId/location/:locationId/program/:programId/offering/:offeringId",
  Locations = "locations",
  Users = "users",
  Designation = "designation",
  Restrictions = "restrictions",
  FileUploads = "files",
  Notes = "notes",
  Applications = "applications",
  ApplicationDetail = "student/:studentId/application/:applicationId",
  SupportingUserDetail = "supporting-user/:supportingUserId",
  // Supporting Users
  SupportingUsersRoot = "/supporting-users",
  SupportingUsersDashboard = "dashboard",
  ParentSupportingInfo = "supporting-info/parent",
  PartnerSupportingInfo = "supporting-info/partner",
  // Shared
  Login = "login",
  LoginWithBusinessBCeID = "login/business-bceid",
  DisabledUser = "login/disabled-user",
  UnknownUser = "login/unknown-user",
  ForbiddenUser = "/forbidden-user",
  NotAllowedUser = "login/not-allowed-user",
  StudentNotes = "student-notes/:studentId",
  StudentRestrictions = "student-restrictions/:studentId",
}
