import {
  DataTableSortByOrder,
  FieldSortOrder,
  PaginationOptions,
  PaginationParams,
} from "@/types";

/**
 * Builds the query string parameters for pagination.
 * @param paginationOptions pagination options.
 * @returns the URL query string in a format like parameter1=value1&parameter2=value2.
 */
export const getPaginationQueryString = (
  paginationOptions: PaginationOptions,
) => {
  // Convert Vuetify Data Table one-based page index to support API zero-based page index.
  paginationOptions.page = paginationOptions.page - 1;

  const parameters: string[] = [];
  // Pagination parameters.
  parameters.push(`${PaginationParams.Page}=${paginationOptions.page}`);
  parameters.push(
    `${PaginationParams.PageLimit}=${paginationOptions.pageLimit}`,
  );
  // Sort parameters.
  if (paginationOptions.sortField && paginationOptions.sortOrder) {
    let sortDBOrder = "";
    switch (paginationOptions.sortOrder) {
      case DataTableSortByOrder.DESC:
        sortDBOrder = FieldSortOrder.DESC;
        break;
      case DataTableSortByOrder.ASC:
        sortDBOrder = FieldSortOrder.ASC;
    }
    parameters.push(
      `${PaginationParams.SortField}=${paginationOptions.sortField}`,
    );
    parameters.push(`${PaginationParams.SortOrder}=${sortDBOrder}`);
  }

  // Search criteria.
  if (
    paginationOptions.searchCriteria &&
    typeof paginationOptions.searchCriteria === "string"
  ) {
    parameters.push(
      `${PaginationParams.SearchCriteria}=${paginationOptions.searchCriteria}`,
    );
  }
  if (
    paginationOptions.searchCriteria &&
    typeof paginationOptions.searchCriteria === "object"
  ) {
    const searchCriteria = paginationOptions.searchCriteria;
    for (const searchCriterion in searchCriteria) {
      parameters.push(`${searchCriterion}=${searchCriteria[searchCriterion]}`);
    }
  }
  return parameters.join("&");
};
