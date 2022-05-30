/**
 * Common DTO result used when an API endpoint
 * must enable pagination and search options.
 */
export interface PaginatedResultsAPIOutDTO<T> {
  results: T[];
  count: number;
}
