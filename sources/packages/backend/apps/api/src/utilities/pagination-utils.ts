/**
 * Generic interface for paginated results.
 */
export interface PaginatedResults<T> {
  results: T[];
  count: number;
}

/**
 * Special object that defines order condition for ORDER BY in sql.
 *
 * Example:
 * {
 *  "name": "ASC",
 *  "id": "DESC"
 * }
 */
export declare type OrderByCondition = {
  [columnName: string]:
    | ("ASC" | "DESC")
    | {
        order: "ASC" | "DESC";
        nulls?: "NULLS FIRST" | "NULLS LAST";
      };
};
