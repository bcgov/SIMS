import ApiClient from "@/services/http/ApiClient";
import { CASInvoiceBatchesAPIOutDTO } from "@/services/http/dto";

export class CASInvoiceBatchService {
  /**
   * Share instance.
   */
  private static instance: CASInvoiceBatchService;

  public static get shared(): CASInvoiceBatchService {
    return this.instance || (this.instance = new this());
  }

  async getInvoiceBatches(): Promise<CASInvoiceBatchesAPIOutDTO> {
    return ApiClient.CASInvoiceBatchApi.getInvoiceBatches();
  }
}
