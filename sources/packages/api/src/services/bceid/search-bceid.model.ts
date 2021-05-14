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
   * Guid from the BCeID user executing the search.
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

/**
 * Pagination options allowed on BCeID Web Service search request.
 */
export class PaginationOptions {
  pageSize?: Number = PAGINATION_MAX_PAGE_SIZE;
  pageIndex?: Number = PAGINATION_FIRST_PAGE_INDEX;
}

/**
 * Search result from a BCeID Web Service request.
 */
export interface SearchBCeIDAccountResult {
  readonly accounts: SearchResultAccount[];
  readonly paginationResult: PaginationResult;
}

/**
 * Represents each BCeID account returned from the search operation.
 */
export interface SearchResultAccount {
  readonly guid: string;
  readonly userId: string;
  readonly displayName: string;
  readonly email: string;
  readonly firstname: string;
  readonly surname: string;
  readonly telephone: string;
}

/**
 * Pagination result from the BCeID Web Service result
 * that contains informations useful to handle the pagination,
 * for instance, the total of items present on the server, that
 * could be different from the total of items returned due to
 * the size of the page requested.
 */
export interface PaginationResult {
  /**
   * Total of items that would be returned by the search
   * disconsidering the page size requested.
   */
  readonly totalItems: number;
  /**
   * Size of the page requested.
   */
  readonly requestedPageSize: number;
  /**
   * Index of the page returned.
   * Please note that the page index is not 0 based,
   * the first page is the index 1.
   */
  readonly requestedPageIndex: number;
}
