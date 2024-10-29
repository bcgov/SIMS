import { FieldSortOrder } from "@sims/utilities";

/**
 *  Base Pagination option.
 */
export interface BasePaginationOptions {
  sortField?: string;
  sortOrder?: FieldSortOrder;
  page: number;
  pageLimit: number;
}

/**
 *  Pagination option.
 */
export interface PaginationOptions extends BasePaginationOptions {
  searchCriteria?: string;
}

/**
 * Program pagination option allowing for multiple criteria search.
 */
export interface ProgramPaginationOptions extends BasePaginationOptions {
  programNameSearch?: string;
  locationNameSearch?: string;
  statusSearch?: string;
  inactiveProgramSearch?: boolean;
}

export enum SortPriority {
  Priority1 = 1,
  Priority2 = 2,
  Priority3 = 3,
  Priority4 = 4,
}
