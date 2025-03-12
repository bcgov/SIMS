import { PaginationOptions } from "@/types";
import HttpBaseClient from "./common/HttpBaseClient";
import { PaginatedResultsAPIOutDTO } from "@/services/http/dto";
import { getPaginationQueryString } from "@/helpers";
import { CASInvoiceAPIOutDTO } from "@/services/http/dto/CASInvoice.dto";

/**
 * Http API client for CAS invoices.
 */
export class CASInvoiceApi extends HttpBaseClient {
  /**
   * Retrieves all CAS invoices.
   * @param paginationOptions pagination options.
   * @returns list of all invoices.
   */
  async getInvoices(
    paginationOptions: PaginationOptions,
  ): Promise<PaginatedResultsAPIOutDTO<CASInvoiceAPIOutDTO>> {
    const url = `cas-invoice?${getPaginationQueryString(
      paginationOptions,
      true,
    )}`;
    return this.getCall(this.addClientRoot(url));
  }

  /**
   * Resolves the specified CAS invoice.
   * @param invoiceId invoice id.
   */
  async resolveCASInvoice(invoiceId: number): Promise<void> {
    await this.patchCall(
      this.addClientRoot(`cas-invoice/${invoiceId}/resolve`),
      undefined,
    );
  }
}
