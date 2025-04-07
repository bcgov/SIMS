import { FieldSortOrder, OrderByCondition } from "@sims/utilities";

/**
 * Transformation to convert the application data table column name to database column name.
 * Any changes to the data object (e.g data table) in presentation layer must be adjusted here.
 * @param sortField database fields to be sorted.
 * @param sortOrder sort order of fields (Ascending or Descending order).
 * @returns OrderByCondition
 */
export function transformToApplicationEntitySortField(
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
    submittedDate: "application.submittedDate",
    studyStartPeriod: "offering.studyStartDate",
    studyEndPeriod: "offering.studyEndDate",
    pirStatus: "application.pirStatus",
  };
  const dbColumnName = fieldSortOptions[sortField];
  if (dbColumnName) {
    orderByCondition[dbColumnName] = sortOrder;
  }
  return orderByCondition;
}

/**
 * Transformation to convert the application offering change request data table column name to
 * database column name. Any changes to the data object (e.g data table) in presentation layer
 * must be adjusted here.
 * @param sortField database fields to be sorted.
 * @param sortOrder sort order of fields (Ascending or Descending order).
 * @returns OrderByCondition
 */
export function transformToApplicationOfferingChangeEntitySortField(
  sortField = "status",
  sortOrder = FieldSortOrder.DESC,
): OrderByCondition {
  const orderByCondition = {};

  if (sortField === "dateSubmitted") {
    orderByCondition["applicationOfferingChangeRequest.createdAt"] = sortOrder;
  }

  if (sortField === "status") {
    orderByCondition[
      "applicationOfferingChangeRequest.applicationOfferingChangeRequestStatus"
    ] = sortOrder;
    orderByCondition["applicationOfferingChangeRequest.createdAt"] =
      FieldSortOrder.ASC;
  }

  return orderByCondition;
}
