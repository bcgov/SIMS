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

/**
 * SORT ORDER  of DataTable
 */
export enum DataTableSortOrder {
  DESC = -1,
  ASC = 1,
}

export const DEFAULT_PAGE_LIMIT = 10;
export const ITEMS_PER_PAGE = [
  { value: 10, title: "10" },
  { value: 25, title: "25" },
  { value: 50, title: "50" },
  { value: 100, title: "100" },
];
// TODO: Remove DEFAULT_PAGE_NUMBER when all primevue datatable removed.
export const DEFAULT_PAGE_NUMBER = 0;
export const PAGINATION_LIST = [10, 20, 50];

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
 * programs on the basis of program name, location name, status etc.)
 * todo: remove sortOrder: DataTableSortOrder when all primevue datatables are removed.
 */
export interface PaginationOptions {
  searchCriteria?: string | Record<string, string | string[] | boolean>;
  sortField?: string;
  sortOrder?: DataTableSortOrder | DataTableSortByOrder;
  page: number;
  pageLimit: number;
}

/**
 * Interface for data returned by
 * page and sort event of PrimeVue data table.
 * TODO:This must be modified when migrating to Vuetify3 accordingly.
 */
export interface PageAndSortEvent {
  page: number;
  rows: number;
  sortField: string;
  sortOrder: number;
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
    align: "start" as const,
  },
  { title: "Application #", key: "applicationNumber", sortable: false },
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
