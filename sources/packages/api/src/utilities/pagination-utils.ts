// Generic interface for paginated results
export class PaginatedResults<T> {
  results: T[];
  count: number;
}
