/**
 * Application roles to be used in alongside with RolesGuard.
 */
export enum Role {
  /**
   * AEST roles.
   */
  AESTReports = "aest-reports",
  AESTCreateInstitution = "aest-create-institution",
  StudentAddRestriction = "student-add-restriction",
  StudentResolveRestriction = "student-resolve-restriction",
  StudentUploadFile = "student-upload-file",
  StudentApproveDeclineAccountRequests = "student-approve-decline-account-requests",
  StudentApproveDeclineExceptions = "student-approve-decline-exceptions",
  StudentApproveDeclineAppeals = "student-approve-decline-appeals",
  StudentAddSINExpiry = "student-add-sin-expiry",
  StudentAddNewSIN = "student-add-new-sin",
  StudentCreateNote = "student-create-note",
  InstitutionEditProfile = "institution-edit-profile",
  InstitutionApproveDeclineProgram = "institution-approve-decline-program",
  InstitutionApproveDeclineOffering = "institution-approve-decline-offering",
  InstitutionEditLocationDetails = "institution-edit-location-details",
  InstitutionAddNewUser = "institution-add-new-user",
  InstitutionEditUser = "institution-edit-user",
  InstitutionEnableDisableUser = "institution-enable-disable-user",
  InstitutionAddRestriction = "institution-add-restriction",
  InstitutionResolveRestriction = "institution-resolve-restriction",
  InstitutionCreateNote = "institution-create-note",
  InstitutionApproveDeclineDesignation = "institution-approve-decline-designation",
  InstitutionApproveDeclineOfferingChanges = "institution-approve-decline-offering-changes",
}
