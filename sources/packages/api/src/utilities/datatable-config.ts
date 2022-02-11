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
export interface PaginationOptions {
  searchCriteria?: string;
  sortField?: string;
  sortOrder?: FieldSortOrder;
  page: number;
  pageLimit: number;
}

export enum SortPriority {
  Priority1 = 1,
  Priority2 = 2,
  Priority3 = 3,
  Priority4 = 4,
}

/**Pagination Query param constants **/
export enum PaginationParams {
  SortField = "sortField",
  SortOrder = "sortOrder",
  Page = "page",
  PageLimit = "pageLimit",
  SearchCriteria = "searchCriteria",
}
