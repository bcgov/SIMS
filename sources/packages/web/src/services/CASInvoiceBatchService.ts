import { useFileUtils } from "@/composables";
import ApiClient from "@/services/http/ApiClient";
import {
  CASInvoiceBatchAPIOutDTO,
  PaginatedResultsAPIOutDTO,
  UpdateCASInvoiceBatchAPIInDTO,
} from "@/services/http/dto";
import { PaginationOptions } from "@/types";

export class CASInvoiceBatchService {
  /**
   * Shared instance.
   */
  private static instance: CASInvoiceBatchService;

  static get shared(): CASInvoiceBatchService {
    return this.instance || (this.instance = new this());
  }

  /**
   * Retrieves all CAS invoice batches.
   * @param paginationOptions pagination options.
   * @returns list of all invoice batches.
   */
  async getInvoiceBatches(
    paginationOptions: PaginationOptions,
  ): Promise<PaginatedResultsAPIOutDTO<CASInvoiceBatchAPIOutDTO>> {
    return ApiClient.CASInvoiceBatchApi.getInvoiceBatches(paginationOptions);
  }

  /**
   * Downloads the batch invoices report with information to be reviewed by the Ministry
   * to support the batch approval and allow invoices to be sent to CAS.
   * @param casInvoiceBatchId batch ID to have the report generated for.
   */
  async downloadCASInvoiceBatchReport(
    casInvoiceBatchId: number,
  ): Promise<void> {
    const file = await ApiClient.CASInvoiceBatchApi.getCASInvoiceBatchReport(
      casInvoiceBatchId,
    );
    const { downloadFileAsBlob } = useFileUtils();
    downloadFileAsBlob(file);
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
    await ApiClient.CASInvoiceBatchApi.updateCASInvoiceBatch(
      casInvoiceBatchId,
      payload,
    );
  }
}
