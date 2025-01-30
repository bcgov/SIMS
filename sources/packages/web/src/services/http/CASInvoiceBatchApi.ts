import { PaginationOptions } from "@/types";
import HttpBaseClient from "./common/HttpBaseClient";
import {
  CASInvoiceBatchAPIOutDTO,
  PaginatedResultsAPIOutDTO,
} from "@/services/http/dto";
import { getPaginationQueryString } from "@/helpers";

/**
 * Http API client for CAS invoice batches.
 */
export class CASInvoiceBatchApi extends HttpBaseClient {
  /**
   * Retrieves all CAS invoice batches.
   * @param paginationOptions options for pagination.
   * @returns list of all invoice batches.
   */
  async getInvoiceBatches(
    paginationOptions: PaginationOptions,
  ): Promise<PaginatedResultsAPIOutDTO<CASInvoiceBatchAPIOutDTO>> {
    const url = `cas-invoice-batch?${getPaginationQueryString(
      paginationOptions,
      true,
    )}`;
    return this.getCall(this.addClientRoot(url));
  }
}
