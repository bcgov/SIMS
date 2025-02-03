import { PaginationOptions } from "@/types";
import HttpBaseClient from "./common/HttpBaseClient";
import {
  CASInvoiceBatchAPIOutDTO,
  PaginatedResultsAPIOutDTO,
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
      true,
    )}`;
    return this.getCall(this.addClientRoot(url));
  }

  /**
   * Batch invoices report with information to be reviewed by the Ministry
   * to support the batch approval and allow invoices to be sent to CAS.
   * @param casInvoiceBatchId batch ID to have the report generated for.
   * @returns file contents
   */
  async getInvoiceBatchesReport(
    casInvoiceBatchId: number,
  ): Promise<AxiosResponse<unknown>> {
    return this.downloadFile(`cas-invoice-batch/${casInvoiceBatchId}/report`);
  }
}
