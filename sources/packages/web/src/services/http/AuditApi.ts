import { AuthService } from "@/services/AuthService";
import HttpBaseClient from "./common/HttpBaseClient";
import { AuditAPIInDTO } from "@/services/http/dto";

/**
 * Audit API.
 */
export class AuditApi extends HttpBaseClient {
  /**
   * Sends an event to be logged in the API logger.
   * The call is skipped when there is no valid token, since the API would reject it with a 401.
   * @param payload payload.
   */
  async audit(payload: AuditAPIInDTO): Promise<void> {
    const keycloak = AuthService.shared.keycloak;
    if (!keycloak?.token || keycloak.isTokenExpired()) {
      return;
    }
    await this.postCall("audit", payload);
  }
}
