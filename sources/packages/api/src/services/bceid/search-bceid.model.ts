/**
 * While executing a search on BCeID, this is considered
 * the index of the first page.
 */
export const PAGINATION_FIRST_PAGE_INDEX = 1;
/**
 * While executing a search on BCeID, this is
 * the maximun page size allowed.
 */
export const PAGINATION_MAX_PAGE_SIZE = 500;

export class SearchAccountOptions {
  requesterUserGuid: string;
  businessGuid: string;
  pagination = new PaginationOptions();
}

export class PaginationOptions {
  pageSize?: Number = PAGINATION_MAX_PAGE_SIZE;
  pageIndex?: Number = PAGINATION_FIRST_PAGE_INDEX;
}

export interface SearchBCeIDAccountResult {
  accounts: SearchResultAccount[];
}

export interface SearchResultAccount {
  guid: string;
  userId: string;
  email: string;
  firstname: string;
  surname: string;
  telephone: string;
}
