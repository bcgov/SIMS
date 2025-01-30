import ApiClient from "@/services/http/ApiClient";
import {
  CASInvoiceBatchAPIOutDTO,
  PaginatedResultsAPIOutDTO,
} from "@/services/http/dto";
import { PaginationOptions } from "@/types";

export class CASInvoiceBatchService {
  /**
   * Shared instance.
   */
  private static instance: CASInvoiceBatchService;

  public static get shared(): CASInvoiceBatchService {
    return this.instance || (this.instance = new this());
  }

  /**
   * Retrieves all CAS invoice batches.
   * @param paginationOptions: PaginationOptions,
   * @returns list of all invoice batches.
   */
  async getInvoiceBatches(
    paginationOptions: PaginationOptions,
  ): Promise<PaginatedResultsAPIOutDTO<CASInvoiceBatchAPIOutDTO>> {
    return ApiClient.CASInvoiceBatchApi.getInvoiceBatches(paginationOptions);
  }
}
