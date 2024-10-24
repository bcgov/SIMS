import {
  DataTableSortByOrder,
  DataTableSortOrder,
  FieldSortOrder,
  PaginationOptions,
  PaginationParams,
} from "@/types";

/**
 * @deprecated use getPaginationQueryString
 * Helper to append pagination sort and order to the url
 * @param url api url
 * @param sortField sortField
 * @param sortOrder sortOrder
 * @returns url with append sort options to url
 */
export function addSortOptions(
  url: string,
  sortField?: string,
  sortOrder?: DataTableSortOrder | DataTableSortByOrder,
): string {
  if (sortField && sortOrder) {
    const sortDBOrder =
      sortOrder === DataTableSortOrder.DESC
        ? FieldSortOrder.DESC
        : FieldSortOrder.ASC;
    url = `${url}&${PaginationParams.SortField}=${sortField}&${PaginationParams.SortOrder}=${sortDBOrder}`;
  }
  return url;
}

/**
 * @deprecated use getPaginationQueryString
 * Utility to build the pagination query parameters.
 * @param url
 * @param page
 * @param pageLimit
 * @param joinString The string that connects URL and the params built.
 * For first query param it can be ? and for others it can be &.
 * @returns URL with pagination options.
 */
export const addPaginationOptions = (
  url: string,
  page: number,
  pageLimit: number,
  joinString: string,
): string => {
  return `${url}${joinString}${PaginationParams.Page}=${page}&${PaginationParams.PageLimit}=${pageLimit}`;
};

/**
 * Builds the query string parameters for pagination.
 * @param paginationOptions pagination options.
 * @param enableZeroPage enabling this will make the page staring from 0 instead of 1,
 * enableZeroPage is a temporary solution.
 * @returns the URL query string in a format like parameter1=value1&parameter2=value2.
 */
export const getPaginationQueryString = (
  paginationOptions: PaginationOptions,
  enableZeroPage = false,
) => {
  if (enableZeroPage) {
    paginationOptions.page = paginationOptions.page - 1;
  }

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
      case DataTableSortOrder.DESC:
      case DataTableSortByOrder.DESC:
        sortDBOrder = FieldSortOrder.DESC;
        break;
      case DataTableSortOrder.ASC:
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
