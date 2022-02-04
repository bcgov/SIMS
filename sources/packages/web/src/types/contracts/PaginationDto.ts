// Generic interface for paginated results
export interface PaginatedResults<T> {
  results: T[];
  count: number;
}
