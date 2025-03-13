import ApiClient from "@/services/http/ApiClient";
import {
  CASInvoiceAPIOutDTO,
  PaginatedResultsAPIOutDTO,
} from "@/services/http/dto";
import { PaginationOptions } from "@/types";

export class CASInvoiceService {
  /**
   * Shared instance.
   */
  private static instance: CASInvoiceService;

  static get shared(): CASInvoiceService {
    return this.instance || (this.instance = new this());
  }

  /**
   * Retrieves all the CAS invoices.
   * @param paginationOptions pagination options.
   * @returns list of all invoices.
   */
  async getInvoices(
    paginationOptions: PaginationOptions,
  ): Promise<PaginatedResultsAPIOutDTO<CASInvoiceAPIOutDTO>> {
    return ApiClient.CASInvoiceApi.getInvoices(paginationOptions);
  }

  /**
   * Resolves the specified CAS invoice.
   * @param invoiceId invoice id.
   */
  async resolveCASInvoice(invoiceId: number): Promise<void> {
    return ApiClient.CASInvoiceApi.resolveCASInvoice(invoiceId);
  }
}
