/**
 * Common result format used when an API result
 * must enable pagination and search options.
 */
export interface PaginatedResultsAPIOutDTO<T> {
  results: T[];
  count: number;
}
