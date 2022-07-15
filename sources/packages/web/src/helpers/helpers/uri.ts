import {
  DataTableSortOrder,
  FieldSortOrder,
  PaginationOptions,
  PaginationParams,
} from "@/types";

/**
 * helper to append pagination sort and order to the url
 * @param url api url
 * @param sortField sortField
 * @param sortOrder sortOrder
 * @returns url with append sort options to url
 */
export function addSortOptions(
  url: string,
  sortField?: string,
  sortOrder?: DataTableSortOrder,
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
  joinString = "",
): string => {
  return `${url}${joinString}${PaginationParams.Page}=${page}&${PaginationParams.PageLimit}=${pageLimit}`;
};

/**
 * Builds the query string parameters for pagination.
 * @param paginationOptions pagination options.
 * @returns the URL query string in a format like parameter1=value1&parameter2=value2.
 */
export const getPaginationQueryString = (
  paginationOptions: PaginationOptions,
) => {
  const parameters: string[] = [];
  // Paginations parameters.
  parameters.push(`${PaginationParams.Page}=${paginationOptions.page}`);
  parameters.push(
    `${PaginationParams.PageLimit}=${paginationOptions.pageLimit}`,
  );
  // Sort parameters.
  if (paginationOptions.sortField && paginationOptions.sortOrder) {
    const sortDBOrder =
      paginationOptions.sortOrder === DataTableSortOrder.DESC
        ? FieldSortOrder.DESC
        : FieldSortOrder.ASC;
    parameters.push(
      `${PaginationParams.SortField}=${paginationOptions.sortField}`,
    );
    parameters.push(`${PaginationParams.SortOrder}=${sortDBOrder}`);
  }
  // Search criteria.
  if (paginationOptions.searchCriteria) {
    parameters.push(
      `${PaginationParams.SearchCriteria}=${paginationOptions.searchCriteria}`,
    );
  }
  return parameters.join("&");
};
