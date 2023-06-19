import { FieldSortOrder } from "@sims/utilities";
import { OrderByCondition } from "typeorm";

 /**
   * Transformation to convert the data table column name to database column name.
   * Any changes to the data object (e.g data table) in presentation layer must be adjusted here.
   * @param sortField database fields to be sorted.
   * @param sortOrder sort order of fields (Ascending or Descending order).
   * @returns OrderByCondition
   */
 export function transformToEntitySortField(
  sortField = "applicationNumber",
  sortOrder = FieldSortOrder.ASC,
): OrderByCondition {
  const orderByCondition = {};
  if (sortField === "fullName") {
    orderByCondition["user.firstName"] = sortOrder;
    orderByCondition["user.lastName"] = sortOrder;
    return orderByCondition;
  }

  const fieldSortOptions = {
    applicationNumber: "application.applicationNumber",
  };
  const dbColumnName = fieldSortOptions[sortField];
  orderByCondition[dbColumnName] = sortOrder;
  return orderByCondition;
}
