import { FieldSortOrder } from "@sims/utilities";

/**
 *  Pagination option.
 */
export interface PaginationOptions {
  searchCriteria?: string;
  sortField?: string;
  sortOrder?: FieldSortOrder;
  page: number;
  pageLimit: number;
}

export interface ProgramPaginationOptions extends PaginationOptions {
  programNameSearch?: string;
  locationNameSearch?: string;
  status?: string;
}

export enum SortPriority {
  Priority1 = 1,
  Priority2 = 2,
  Priority3 = 3,
  Priority4 = 4,
}
