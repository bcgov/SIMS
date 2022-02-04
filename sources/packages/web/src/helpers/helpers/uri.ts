import { DataTableSortOrder, FieldSortOrder } from "@/types";

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
    url = `${url}&sortField=${sortField}&sortOrder=${sortDBOrder}`;
  }
  return url;
}
