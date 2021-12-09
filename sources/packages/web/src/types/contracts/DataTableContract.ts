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
 * SORT ORDER  of datatable
 */
export enum DataTableSortOrder {
  DESC = -1,
  ASC = 1,
}

export const DEFAULT_PAGE_LIMIT = 2;
export const DEFAULT_PAGE_NUMBER = 0;
export const PAGINATION_LIST = [1, 2, 5, 10, 20, 50];
