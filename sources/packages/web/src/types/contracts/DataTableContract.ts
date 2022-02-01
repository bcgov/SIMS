/**
 * Enumeration for DB Sort order
 */
export enum FieldSortOrder {
  DESC = "DESC",
  ASC = "ASC",
}

/**
 * Enum for Institution User Table
 */
export enum UserFields {
  DisplayName = "displayName",
  Email = "email",
  UserType = "userType",
  Role = "role",
  Location = "location",
  IsActive = "isActive",
}

/**
 * Enum for Student Application Table
 */
export enum StudentApplicationFields {
  ApplicationNumber = "applicationNumber",
  ApplicationName = "applicationName",
  StudyPeriod = "studyPeriod",
  Submitted = "submitted",
  Status = "status",
  Actions = "id",
}

/**
 * SORT ORDER  of DataTable
 */
export enum DataTableSortOrder {
  DESC = -1,
  ASC = 1,
}

export const DEFAULT_PAGE_LIMIT = 10;
export const DEFAULT_PAGE_NUMBER = 0;
export const PAGINATION_LIST = [10, 20, 50];

/**
 * Enum for Program DataTable
 */
export enum InstitutionProgramSummaryFields {
  CipCode = "cipCode",
  Name = "name",
  CredentialType = "credentialType",
  TotalOfferings = "totalOfferings",
  ApprovalStatus = "approvalStatus",
  IsActive = "isActive",
}

/**
 * Enum for Program offering DataTable
 */
export enum OfferingSummaryFields {
  OfferingName = "name",
  StudyDates = "studyDates",
  OfferingIntensity = "offeringIntensity",
  OfferingDelivered = "offeringDelivered",
  Location = "location",
  IsActive = "isActive",
}

/**
 * Enum for AEST Program Table
 */
export enum AESTProgramFields {
  SubmittedDate = "submittedDate",
  ProgramName = "programName",
  LocationName = "locationName",
  OfferingsCount = "offeringsCount",
  ProgramStatus = "programStatus",
}
