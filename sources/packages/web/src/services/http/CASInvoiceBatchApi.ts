import HttpBaseClient from "./common/HttpBaseClient";
import { CASInvoiceBatchesAPIOutDTO } from "@/services/http/dto";

/**
 * Http API client for CAS invoice batches.
 */
export class CASInvoiceBatchApi extends HttpBaseClient {
  async getInvoiceBatches(): Promise<CASInvoiceBatchesAPIOutDTO> {
    return this.getCall(this.addClientRoot("cas-invoice-batch"));
  }
}
