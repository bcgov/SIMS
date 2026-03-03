import {
  CASInvoiceBatchApprovalStatus,
  CASInvoiceStatus,
  ProgramStatus,
  OfferingIntensity,
} from "@sims/sims-db";
import { FieldSortOrder } from "@sims/utilities";
import { AppealType } from "../services";

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
 * Program pagination option allowing for multiple criteria search.
 */
export interface ProgramLocationPaginationOptions extends PaginationOptions {
  statusSearch?: ProgramStatus[];
  inactiveProgramSearch?: boolean;
}

/**
 * CAS invoices specific parameters.
 */
export interface CASInvoicePaginationOptions extends BasePaginationOptions {
  invoiceStatusSearch: CASInvoiceStatus;
}

/**
 * CAS invoice batches specific parameters.
 */
export interface CASInvoiceBatchesPaginationOptions extends BasePaginationOptions {
  approvalStatusSearch?: CASInvoiceBatchApprovalStatus[];
}

export enum SortPriority {
  Priority1 = 1,
  Priority2 = 2,
  Priority3 = 3,
  Priority4 = 4,
  Priority5 = 5,
}

/**
 * PIR specific parameters.
 */
export interface PIRPaginationOptions extends BasePaginationOptions {
  search?: string;
  intensityFilter?: OfferingIntensity;
}

/**
 * COE specific parameters.
 */
export interface COEPaginationOptions extends PaginationOptions {
  intensityFilter?: OfferingIntensity;
}

export interface StudentAppealPaginationOptions extends PaginationOptions {
  appealType: AppealType;
}

/**
 *  Offering Pagination options.
 */
export interface OfferingPaginationOptions extends PaginationOptions {
  /**
   * Offering intensity to filter the offerings.
   */
  intensityFilter?: OfferingIntensity;
  /**
   * Study start date from filter.
   */
  studyStartDateFromFilter?: string;
  /**
   * Study start date to filter.
   */
  studyStartDateToFilter?: string;
}
