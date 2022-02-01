/**
 * Enumeration for DB Sort order
 */
export enum FieldSortOrder {
  DESC = "DESC",
  ASC = "ASC",
}
/**
 * default user summary table sort order
 */
export const DEFAULT_PAGE_LIMIT = 10;
export const DEFAULT_PAGE_NUMBER = 0;

// pagination option
export class PaginationOptions {
  searchName?: string;
  sortField?: string;
  sortOrder?: FieldSortOrder;
  page: number;
  pageLimit: number;
}
