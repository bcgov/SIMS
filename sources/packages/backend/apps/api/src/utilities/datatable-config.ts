import {
  CASInvoiceBatchApprovalStatus,
  CASInvoiceStatus,
  ProgramStatus,
} from "@sims/sims-db";
import { FieldSortOrder } from "@sims/utilities";

/**
 *  Base Pagination option.
 */
export interface BasePaginationOptions {
  sortField?: string;
  sortOrder?: FieldSortOrder;
  page: number;
  pageLimit: number;
}

/**
 *  Pagination option.
 */
export interface PaginationOptions extends BasePaginationOptions {
  searchCriteria?: string;
}

/**
 * Program pagination option allowing for multiple criteria search.
 */
export interface ProgramPaginationOptions extends BasePaginationOptions {
  programNameSearch?: string;
  locationNameSearch?: string;
  statusSearch?: ProgramStatus[];
  inactiveProgramSearch?: boolean;
}

/**
 * CAS invoices specific parameters.
 */
export interface CASInvoicePaginationOptionsAPIInDTO
  extends BasePaginationOptions {
  invoiceStatusSearch: CASInvoiceStatus[];
}

/**
 * CAS invoice batches specific parameters.
 */
export interface CASInvoiceBatchesPaginationOptions
  extends BasePaginationOptions {
  approvalStatusSearch?: CASInvoiceBatchApprovalStatus[];
}

export enum SortPriority {
  Priority1 = 1,
  Priority2 = 2,
  Priority3 = 3,
  Priority4 = 4,
  Priority5 = 5,
}
