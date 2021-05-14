/**
 * While executing a search on BCeID, this is considered
 * the index of the first page.
 * It is initialized as 1 as per defined on
 * BCeID Web Service documentation.
 */
export const PAGINATION_FIRST_PAGE_INDEX = 1;
/**
 * While executing a search on BCeID, this is
 * the maximun page size allowed.
 */
export const PAGINATION_MAX_PAGE_SIZE = 500;

/**
 * Search options to retrieve BCeID accounts.
 */
export class SearchAccountOptions {
  /**
   * Guid from the BCeID user executing th search.
   */
  requesterUserGuid: string;
  /**
   * Guid from the institution where the search will be executed.
   */
  businessGuid: string;
  /**
   * Pagination options. This is a required parameter, if not
   * provided, the first page with the maximun allowed records
   * will be retrieved.
   */
  pagination = new PaginationOptions();
}

export class PaginationOptions {
  pageSize?: Number = PAGINATION_MAX_PAGE_SIZE;
  pageIndex?: Number = PAGINATION_FIRST_PAGE_INDEX;
}

export interface SearchBCeIDAccountResult {
  readonly accounts: SearchResultAccount[];
  readonly paginationResult: PaginationResult;
}

export interface SearchResultAccount {
  readonly guid: string;
  readonly userId: string;
  readonly displayName: string;
  readonly email: string;
  readonly firstname: string;
  readonly surname: string;
  readonly telephone: string;
}

export interface PaginationResult {
  readonly totalItems: number;
  readonly requestedPageSize: number;
  readonly requestedPageIndex: number;
}
