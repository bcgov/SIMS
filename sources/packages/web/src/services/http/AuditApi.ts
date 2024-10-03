import HttpBaseClient from "./common/HttpBaseClient";
import { AuditAPIInDTO } from "@/services/http/dto";
/**
 * Audit API.
 */
export class AuditApi extends HttpBaseClient {
  /**
   * Sends an event to be logged in the API logger.
   * @param payload payload.
   */
  async audit(payload: AuditAPIInDTO): Promise<void> {
    this.postCall("audit", payload);
  }
}
