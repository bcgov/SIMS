import { AuditEvent } from "@/types/contracts/AuditEnum";
import HttpBaseClient from "./common/HttpBaseClient";
/**
 * Audit API.
 */
export class AuditApi extends HttpBaseClient {
  /**
   * Sends an event to be logged in the API logger.
   * @param event audit event.

   */
  public async audit(event: AuditEvent): Promise<void> {
    this.postCall(`audit/${event}`, null);
  }
}
