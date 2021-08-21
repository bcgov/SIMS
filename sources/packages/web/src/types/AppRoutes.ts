export enum AppRoutes {
  StudentRoot = "/student",
  InstitutionRoot = "/institution",
  StudentDashboard = "student-dashboard",
  InstitutionDashboard = "institution-dashboard",
  InstitutionProfile = "institution-profile",
  InstitutionUserProfile = "institution-user-profile",
  InstitutionProfileEdit = "institution-profile/edit",
  Login = "login",
  ForbiddenUser = "/forbidden-user",
  LoginWithBusinessBCeID = "login/business-bceid",
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
  LocationProgramInfoRequestSummary = "program-info-request/location/:locationId/summary",
  LocationCOESummary = "confirmation-of-enrollment/location/:locationId/summary",
  LocationCOEDetails = "confirmation-of-enrollment/location/:locationId/application/:applicationId",
  LocationProgramInfoRequestEdit = "program-info-request/location/:locationId/application/:applicationId",
  ManageInstitutionDesignation = "manage-desgination",
  InstitutionManageUsers = "manage-users",
  DisabledUser = "login/disabled-user",
  StudentApplication = "application-form/:selectedForm/programYear/:programYearId/application/:id",
  StudentApplicationSummary = "my-application-summary",
  StudentApplicationDetails = "application/:id",
  Assessment = "application/:applicationId/assessment",
}
