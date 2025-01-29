import ApiClient from "@/services/http/ApiClient";
import { CASInvoiceBatchesAPIOutDTO } from "@/services/http/dto";

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
   * @returns list of all invoice batches.
   */
  async getInvoiceBatches(): Promise<CASInvoiceBatchesAPIOutDTO> {
    return ApiClient.CASInvoiceBatchApi.getInvoiceBatches();
  }
}
