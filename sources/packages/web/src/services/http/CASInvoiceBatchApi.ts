import { PaginationOptions } from "@/types";
import HttpBaseClient from "./common/HttpBaseClient";
import {
  CASInvoiceBatchAPIOutDTO,
  CASInvoiceBatchSummaryTotalsAPIOutDTO,
  PaginatedResultsAPIOutDTO,
  UpdateCASInvoiceBatchAPIInDTO,
} from "@/services/http/dto";
import { getPaginationQueryString } from "@/helpers";
import { AxiosResponse } from "axios";

/**
 * Http API client for CAS invoice batches.
 */
export class CASInvoiceBatchApi extends HttpBaseClient {
  /**
   * Retrieves all CAS invoice batches.
   * @param paginationOptions pagination options.
   * @returns list of all invoice batches.
   */
  async getInvoiceBatches(
    paginationOptions: PaginationOptions,
  ): Promise<PaginatedResultsAPIOutDTO<CASInvoiceBatchAPIOutDTO>> {
    const url = `cas-invoice-batch?${getPaginationQueryString(
      paginationOptions,
    )}`;
    return this.getCall(this.addClientRoot(url));
  }

  /**
   * Batch invoices report with information to be reviewed by the Ministry
   * to support the batch approval and allow invoices to be sent to CAS.
   * @param casInvoiceBatchId batch ID to have the report generated for.
   * @returns file contents.
   */
  async getCASInvoiceBatchReport(
    casInvoiceBatchId: number,
  ): Promise<AxiosResponse<unknown>> {
    return this.downloadFile(`cas-invoice-batch/${casInvoiceBatchId}/report`);
  }

  /**
   * Summary totals of a CAS invoice batch, including the count of invoices
   * for each invoice status and the total amounts for each distribution type.
   * @param casInvoiceBatchId batch ID to have the summary totals retrieved for.
   * @returns batch processing summary and distribution type amounts.
   */
  async getCASInvoiceBatchSummaryTotals(
    casInvoiceBatchId: number,
  ): Promise<CASInvoiceBatchSummaryTotalsAPIOutDTO> {
    const url = `cas-invoice-batch/${casInvoiceBatchId}/summary-totals`;
    return this.getCall(this.addClientRoot(url));
  }

  /**
   * Update the approval status for a CAS invoice batch record.
   * @param casInvoiceBatchId ID of the CAS invoice batch to be updated.
   * @param payload approval status to be updated for the record.
   */
  async updateCASInvoiceBatch(
    casInvoiceBatchId: number,
    payload: UpdateCASInvoiceBatchAPIInDTO,
  ): Promise<void> {
    const url = `cas-invoice-batch/${casInvoiceBatchId}`;
    return this.patchCall(this.addClientRoot(url), payload);
  }
}
