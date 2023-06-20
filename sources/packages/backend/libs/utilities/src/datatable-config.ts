/**
 * Enumeration for DB Sort order.
 */
export enum FieldSortOrder {
  DESC = "DESC",
  ASC = "ASC",
}

export type OrderByCondition = {
  [columnName: string]:
    | ("ASC" | "DESC")
    | {
        order: "ASC" | "DESC";
        nulls?: "NULLS FIRST" | "NULLS LAST";
      };
};
