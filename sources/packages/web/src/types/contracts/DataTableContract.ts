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
  Roles = "roles",
  Locations = "locations",
  IsActive = "isActive",
}

/**
 * Enum for Student Application Table
 */
export enum StudentApplicationFields {
  ApplicationNumber = "applicationNumber",
  StudyPeriod = "studyPeriod",
  Submitted = "submitted",
  Status = "status",
  Actions = "id",
}

export const DEFAULT_PAGE_LIMIT = 10;
export const ITEMS_PER_PAGE = [
  { value: 10, title: "10" },
  { value: 25, title: "25" },
  { value: 50, title: "50" },
  { value: 100, title: "100" },
];

/**
 * Enum for Program offering DataTable
 */
export enum OfferingSummaryFields {
  OfferingName = "name",
  YearOfStudy = "yearOfStudy",
  StudyDates = "studyDates",
  OfferingIntensity = "offeringIntensity",
  OfferingDelivered = "offeringDelivered",
  Location = "location",
  IsActive = "isActive",
}

/**
 * Enum for Program summary DataTable Fields
 */
export enum ProgramSummaryFields {
  SubmittedDate = "submittedDate",
  ProgramName = "programName",
  LocationName = "locationName",
  CipCode = "cipCode",
  CredentialType = "credentialType",
  TotalOfferings = "totalOfferings",
  ProgramStatus = "programStatus",
  IsActive = "isActive",
}

export const ProgramSummaryHeaders = [
  {
    title: "CIP",
    sortable: false,
    key: "cipCode",
  },
  {
    title: "Program Name",
    key: "programName",
  },
  {
    title: "Credential",
    key: "credentialType",
  },
  {
    title: "Study periods",
    sortable: false,
    key: "totalOfferings",
  },
  {
    title: "Status",
    sortable: false,
    key: "programStatus",
  },
  {
    title: "Action",
    sortable: false,
    key: "programId",
  },
];

/**
 * Pagination Query param constants
 */
export enum PaginationParams {
  SortField = "sortField",
  SortOrder = "sortOrder",
  Page = "page",
  PageLimit = "pageLimit",
  SearchCriteria = "searchCriteria",
}

/**
 * Pagination Options.
 * @param searchCriteria search criteria can be a single criterion
 * or it can be an object with multiple search criteria (for eg. search of
 * programs on the basis of program name, location name, status etc.).
 */
export interface PaginationOptions {
  searchCriteria?: string | Record<string, string | string[] | boolean>;
  sortField?: string;
  sortOrder?: DataTableSortByOrder;
  page: number;
  pageLimit: number;
}

/**
 * Vuetify dataTable sort order.
 */
export enum DataTableSortByOrder {
  DESC = "desc",
  ASC = "asc",
}

/**
 * DataTable options.
 */
export interface DataTableOptions {
  itemsPerPage: number;
  page: number;
  sortBy: { key: string; order: DataTableSortByOrder }[] | [];
}

/**
 * Default DataTable page number.
 */
export const DEFAULT_DATATABLE_PAGE_NUMBER = 1;

/**
 * Available to change application offering change summary header.
 */
export const AvailableToChangeOfferingChangeSummaryHeaders = [
  {
    title: "Name",
    key: "fullName",
  },
  {
    title: "Study dates",
    sortable: false,
    key: "studyStartDate",
  },
  {
    title: "Application #",
    key: "applicationNumber",
  },
  {
    title: "Action",
    sortable: false,
    key: "applicationId",
  },
];

/**
 * In progress application offering change summary header.
 */
export const InProgressOfferingChangeSummaryHeaders = [
  {
    title: "Name",
    key: "fullName",
  },
  {
    title: "Study dates",
    sortable: false,
    key: "studyStartDate",
  },
  {
    title: "Application #",
    key: "applicationNumber",
  },
  {
    title: "Status",
    sortable: false,
    key: "status",
  },
  {
    title: "Action",
    sortable: false,
    key: "id",
  },
];

/**
 * Completed application offering change summary header.
 */
export const CompletedOfferingChangeSummaryHeaders = [
  {
    title: "Date completed",
    sortable: false,
    key: "dateCompleted",
  },
  {
    title: "Name",
    key: "fullName",
  },
  {
    title: "Study dates",
    sortable: false,
    key: "studyStartDate",
  },
  {
    title: "Application #",
    key: "applicationNumber",
  },
  {
    title: "Status",
    sortable: false,
    key: "status",
  },
  {
    title: "Action",
    sortable: false,
    key: "id",
  },
];

/**
 * All in progress application offering changes summary header.
 */
export const AllInProgressOfferingChangeSummaryHeaders = [
  {
    title: "Date submitted",
    key: "dateSubmitted",
  },
  {
    title: "Name",
    sortable: false,
    key: "fullName",
  },
  {
    title: "Application #",
    sortable: false,
    key: "applicationNumber",
  },
  {
    title: "Status",
    sortable: false,
    key: "status",
  },
  {
    title: "Action",
    sortable: false,
    key: "id",
  },
];

/**
 * Application withdrawal upload header.
 */
export const ApplicationWithdrawalUploadHeaders = [
  {
    title: "Line",
    sortable: false,
    key: "recordLineNumber",
  },
  {
    title: "Application number",
    sortable: false,
    key: "applicationNumber",
  },
  {
    title: "Withdrawal date",
    sortable: false,
    key: "withdrawalDate",
  },
  {
    title: "Validations",
    sortable: false,
    key: "validations",
  },
];

/**
 * CAS Supplier information header.
 */
export const CASSupplierInformationHeaders = [
  {
    title: "Date created",
    sortable: false,
    key: "dateCreated",
  },
  {
    title: "Status",
    sortable: false,
    key: "supplierStatus",
  },
  {
    title: "Supplier valid",
    sortable: false,
    key: "isValid",
  },
  {
    title: "Supplier",
    sortable: false,
    key: "supplierNumber",
  },
  {
    title: "Supplier active?",
    sortable: false,
    key: "status",
  },
  {
    title: "Site",
    sortable: false,
    key: "supplierSiteCode",
  },
  {
    title: "Site active?",
    sortable: false,
    key: "siteStatus",
  },
  {
    title: "Supplier protected",
    sortable: false,
    key: "supplierProtected",
  },
  {
    title: "Site protected",
    sortable: false,
    key: "siteProtected",
  },
  {
    title: "Address line",
    sortable: false,
    key: "addressLine1",
  },
  {
    title: "Details",
    sortable: false,
    key: "data-table-expand",
  },
];

/**
 * Application Restriction Management header.
 */
export const ApplicationRestrictionManagementHeaders = [
  {
    title: "Restriction Type",
    sortable: false,
    key: "restrictionCategory",
  },
  {
    title: "Restriction Code",
    sortable: false,
    key: "restrictionCode",
  },
  {
    title: "Restriction Status",
    sortable: false,
    key: "restrictionStatus",
  },
  {
    title: "Bypass Status",
    sortable: false,
    key: "bypassStatus",
  },
  {
    title: "View Details",
    sortable: false,
    key: "id",
  },
  {
    title: "Remove Bypass Rule?",
    sortable: false,
    key: "removeBypassRule",
  },
];

/**
 * Program headers.
 */
export const ProgramHeaders = [
  { title: "Date Submitted", sortable: true, key: "submittedDate" },
  { title: "Program Name", sortable: true, key: "programName" },
  { title: "Location", sortable: true, key: "locationName" },
  { title: "Study Periods", sortable: false, key: "totalOfferings" },
  { title: "Status", sortable: true, key: "programStatus" },
  { title: "Action", sortable: false, key: "action" },
];

/**
 * CAS invoices batches headers.
 */
export const CASInvoicesBatchesHeaders = [
  { title: "Batch Date", sortable: true, key: "batchDate" },
  { title: "Batch Name", sortable: false, key: "batchName" },
  { title: "Approval Status", sortable: false, key: "approvalStatus" },
  {
    title: "Approval Status Audit",
    sortable: false,
    key: "approvalStatusAudit",
  },
  {
    title: "Actions",
    sortable: false,
    key: "actions",
  },
];

/**
 * CAS invoice headers.
 */
export const CASInvoiceHeaders = [
  {
    title: "Invoice Response Date",
    sortable: true,
    key: "invoiceStatusUpdatedOn",
  },
  { title: "Batch Name", sortable: false, key: "invoiceBatchName" },
  {
    title: "Invoice Number",
    sortable: false,
    key: "invoiceNumber",
  },
  {
    title: "Supplier Number",
    sortable: false,
    key: "supplierNumber",
  },
  {
    title: "Actions",
    sortable: false,
    key: "actions",
  },
  {
    title: "Details",
    sortable: false,
    key: "data-table-expand",
  },
];

/**
 * Student application summary headers for Ministry and Institution users.
 */
export const StudentApplicationsSimplifiedSummaryHeaders = [
  { title: "Application Number", sortable: true, key: "applicationNumber" },
  { title: "Submitted", sortable: false, key: "submitted" },
  { title: "Study Period", sortable: false, key: "studyStartPeriod" },
  { title: "Status", sortable: true, key: "status" },
  { title: "Actions", sortable: false, key: "actions" },
];

/**
 * Student application summary headers for student users only.
 */
export const StudentApplicationsExtendedSummaryHeaders = [
  { title: "Application Number", sortable: true, key: "applicationNumber" },
  { title: "Submitted", sortable: false, key: "submitted" },
  { title: "Study Period", sortable: false, key: "studyStartPeriod" },
  { title: "Status", sortable: true, key: "status" },
  { title: "Actions", sortable: false, key: "actions" },
  { title: "History", sortable: false, key: "data-table-expand" },
];

/**
 * Headers for Program Information Request summary table
 */
export const PIRSummaryHeaders = [
  {
    title: "Submitted Date",
    key: "submittedDate",
    sortable: true,
  },
  { title: "Application Number", key: "applicationNumber", sortable: false },
  { title: "Given Names", key: "givenNames", sortable: false },
  { title: "Last Name", key: "lastName", sortable: false },
  { title: "Student Number", key: "studentNumber", sortable: false },
  { title: "Intensity", key: "studyIntensity", sortable: false },
  { title: "Program", key: "program", sortable: false },
  { title: "Start Date", key: "studyStartPeriod", sortable: true },
  { title: "End Date", key: "studyEndPeriod", sortable: true },
  { title: "Status", key: "pirStatus", sortable: true },
  { title: "Actions", key: "actions", sortable: false },
];

export const StudentProfileLegacyMatchHeaders = [
  { title: "Given names", key: "firstName", sortable: false },
  { title: "Last name", key: "lastName", sortable: false },
  { title: "Date of birth", key: "birthDate", sortable: false },
  { title: "SIN", key: "sin", sortable: false },
  { title: "Actions", key: "actions", sortable: false },
];

export const PendingChangeRequestsTableHeaders = [
  { title: "Date submitted", sortable: true, key: "submittedDate" },
  { title: "Given names", sortable: false, key: "firstName" },
  { title: "Last name", sortable: true, key: "lastName" },
  { title: "Application", sortable: true, key: "applicationNumber" },
  { title: "Action", sortable: false, key: "action" },
];

export const PendingOfferingChangeRequestsHeaders = [
  { title: "Date Submitted", sortable: true, key: "submittedDate" },
  { title: "Institution Name", sortable: true, key: "institutionName" },
  { title: "Location Name", sortable: true, key: "locationName" },
  { title: "Program Name", sortable: true, key: "programName" },
  { title: "Offering Name", sortable: true, key: "offeringName" },
  { title: "Action", sortable: false, key: "actions" },
];

export const COESummaryHeaders = [
  { title: "Name", key: "fullName", sortable: true },
  { title: "Start Date", key: "studyStartDate", sortable: false },
  { title: "End Date", key: "studyEndDate", sortable: true },
  { title: "Application Number", key: "applicationNumber", sortable: false },
  { title: "Intensity", key: "offeringIntensity", sortable: false },
  { title: "Student Number", key: "studentNumber", sortable: false },
  { title: "Disbursement Date", key: "disbursementDate", sortable: true },
  { title: "Status", key: "coeStatus", sortable: true },
  { title: "Action", key: "applicationId", sortable: false },
];

export const StudentAppealsHistoryHeaders = [
  { title: "Submitted Date", key: "submittedDate", sortable: true },
  { title: "Decision Date", key: "assessedDate", sortable: true },
  { title: "Decision Status", key: "appealStatus", sortable: false },
  { title: "Application Number", key: "applicationNumber", sortable: true },
  { title: "Actions", key: "actions", sortable: false },
];

/**
 * Overawards Adjustments header.
 */
export const OverawardAdjustmentsHeaders = [
  { title: "Date Added", sortable: false, key: "dateAdded" },
  { title: "Application #", sortable: false, key: "applicationNumber" },
  { title: "Origin", sortable: false, key: "overawardOrigin" },
  { title: "Added By", sortable: false, key: "addedByUser" },
  { title: "Award", sortable: false, key: "awardValueCode" },
  { title: "Amount", sortable: false, key: "overawardValue" },
];

/**
 * Search Students header.
 */
export const SearchStudentsHeaders = [
  { title: "SIN", sortable: true, key: "sin" },
  { title: "Given name", sortable: true, key: "firstName" },
  { title: "Last name", sortable: true, key: "lastName" },
  { title: "Date of birth", sortable: false, key: "birthDate" },
  { title: "Action", sortable: false, key: "action" },
];

/**
 * Search Institutions header.
 */
export const SearchInstitutionsHeaders = [
  { title: "Operating Name", sortable: true, key: "operatingName" },
  { title: "Legal Name", sortable: true, key: "legalName" },
  { title: "Address", sortable: false, key: "address" },
  { title: "Action", sortable: false, key: "action" },
];

/**
 * Social Insurance Number header.
 */
export const SocialInsuranceNumberHeaders = [
  { title: "Date created", sortable: false, key: "createdAtFormatted" },
  { title: "SIN", sortable: false, key: "sinFormatted" },
  { title: "SIN validated", sortable: false, key: "isValidSINFormatted" },
  { title: "Response code", sortable: false, key: "sinStatus" },
  { title: "SIN accepted", sortable: false, key: "validSINCheckFormatted" },
  { title: "First name", sortable: false, key: "validFirstNameCheckFormatted" },
  { title: "Last name", sortable: false, key: "validLastNameCheckFormatted" },
  {
    title: "Date of birth",
    sortable: false,
    key: "validBirthdateCheckFormatted",
  },
  { title: "Gender", sortable: false, key: "validGenderCheckFormatted" },
  { title: "Expiry date", sortable: false, key: "sinExpiryDateFormatted" },
  { title: "Action", sortable: false, key: "action" },
];

/**
 * Part Time Monthly Balance header.
 */
export const PartTimeMonthlyBalanceHeaders = [
  { title: "Date", sortable: false, key: "balanceDate" },
  { title: "CSLP Balance", sortable: false, key: "cslBalance" },
];

/**
 * Student Restrictions header.
 */
export const StudentRestrictionsHeaders = [
  { title: "Category", sortable: true, key: "restrictionCategory" },
  { title: "Reason", sortable: false, key: "description" },
  { title: "Added", sortable: false, key: "createdAt" },
  { title: "Resolved", sortable: false, key: "resolvedAt" },
  { title: "Status", sortable: false, key: "isActive" },
  { title: "Actions", sortable: false, key: "restrictionId" },
];

/**
 * Student File Uploads header.
 */
export const StudentFileUploadsHeaders = [
  { title: "Document Purpose", sortable: true, key: "groupName" },
  { title: "Uploaded by", sortable: false, key: "uploadedBy" },
  { title: "Application #", sortable: false, key: "applicationNumber" },
  { title: "Date Submitted", sortable: false, key: "createdAt" },
  { title: "File", sortable: false, key: "fileName" },
];

/**
 * Designation Requests header.
 */
export const DesignationRequestsHeaders = [
  { title: "Date submitted", sortable: false, key: "submittedDate" },
  { title: "Start date", sortable: false, key: "startDate" },
  { title: "Expiry date", sortable: false, key: "endDate" },
  { title: "Status", sortable: false, key: "designationStatus" },
  { title: "Action", sortable: false, key: "action" },
];

/**
 * Institutions Restrictions header.
 */
export const InstitutionRestrictionsHeaders = [
  { title: "Location", sortable: true, key: "locationName" },
  { title: "Program", sortable: true, key: "programName" },
  { title: "Reason", sortable: false, key: "description" },
  { title: "Added", sortable: false, key: "createdAt" },
  { title: "Resolved", sortable: false, key: "resolvedAt" },
  { title: "Status", sortable: true, key: "isActive" },
  { title: "Action", sortable: false, key: "action" },
];

/** Offerings Upload header. */
export const OfferingsUploadHeaders = [
  { title: "Line", sortable: false, key: "recordLineNumber" },
  { title: "Location", sortable: false, key: "locationCode" },
  { title: "Program code", sortable: false, key: "sabcProgramCode" },
  { title: "Start date", sortable: false, key: "startDateFormatted" },
  { title: "End date", sortable: false, key: "endDateFormatted" },
  { title: "Status", sortable: false, key: "offeringStatus" },
  { title: "Validations", sortable: false, key: "validations" },
];

/**
 * Pending Designations header.
 */
export const PendingDesignationsHeaders = [
  { title: "Institution Name", sortable: false, key: "legalOperatingName" },
  { title: "Submitted on", sortable: false, key: "submittedDate" },
  { title: "Status", sortable: false, key: "designationStatus" },
  { title: "Action", sortable: false, key: "designationId" },
];

/**
 * Offering Summary header.
 */
export const OfferingSummaryHeaders = [
  { title: "Name", sortable: true, key: "name" },
  { title: "Year of Study", sortable: false, key: "yearOfStudy" },
  { title: "Study Start Date", sortable: true, key: "studyStartDate" },
  { title: "Study End Date", sortable: true, key: "studyEndDate" },
  { title: "Intensity", sortable: true, key: "offeringIntensity" },
  { title: "Offering Type", sortable: false, key: "offeringType" },
  { title: "Study Delivery", sortable: true, key: "offeringDelivered" },
  { title: "Status", sortable: true, key: "offeringStatus" },
  { title: "Action", sortable: false, key: "action" },
];

/**
 * Institution Users header.
 */
export const InstitutionUsersHeaders = [
  { title: "Name", sortable: true, key: "displayName" },
  { title: "Email", sortable: true, key: "email" },
  { title: "User Type", sortable: false, key: "userType" },
  { title: "Role", sortable: false, key: "roles" },
  { title: "Locations", sortable: false, key: "locations" },
  { title: "Status", sortable: false, key: "isActive" },
  { title: "Action", sortable: false, key: "action" },
];

/**
 * Student Account Requests header.
 */
export const StudentAccountRequestsHeaders = [
  { title: "Date submitted", sortable: false, key: "submittedDate" },
  { title: "Given names", sortable: false, key: "givenNames" },
  { title: "Last name", sortable: false, key: "lastName" },
  { title: "Date of birth", sortable: false, key: "dateOfBirth" },
  { title: "Action", sortable: false, key: "action" },
];

/**
 * Completed Changes header.
 */
export const CompletedChangesHeaders = [
  { title: "Submitted date", sortable: true, key: "submittedDate" },
  { title: "Type", sortable: true, key: "triggerType" },
  { title: "Tags", sortable: false, key: "tags" },
  { title: "Request form", sortable: false, key: "requestForm" },
  { title: "Status", sortable: true, key: "status" },
  { title: "Assessment date", sortable: true, key: "assessmentDate" },
  { title: "Assessment", sortable: false, key: "assessment" },
];

/**
 * Unapproved Changes header.
 */
export const UnapprovedChangesHeaders = [
  { title: "Submitted date", sortable: true, key: "submittedDate" },
  { title: "Type", sortable: true, key: "requestType" },
  { title: "Request form", sortable: false, key: "requestForm" },
  { title: "Status", sortable: true, key: "status" },
];

/**
 * Report a Change Applications header.
 */
export const ReportAChangeApplicationsHeaders = [
  { title: "Name", sortable: true, key: "fullName" },
  { title: "Study dates", sortable: false, key: "studyDates" },
  { title: "Application #", sortable: true, key: "applicationNumber" },
  { title: "Status", sortable: false, key: "applicationStatus" },
  { title: "Action", sortable: false, key: "action" },
];

/**
 * Exception requests header.
 */
export const ExceptionRequestsHeaders = [
  { title: "Date submitted", sortable: true, key: "submittedDate" },
  { title: "Given names", sortable: true, key: "givenNames" },
  { title: "Last name", sortable: true, key: "lastName" },
  { title: "Application #", sortable: true, key: "applicationNumber" },
  { title: "Action", sortable: false, key: "action" },
];
