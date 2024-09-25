import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import { ApplicationRestrictionBypassHistoryAPIOutDTO } from "@/services/http/dto";

/**
 * Http API client for Bypassed Restrictions.
 */
export class ApplicationRestrictionBypassApi extends HttpBaseClient {
  /**
   * API client to call the application bypassed restrictions rest API.
   * @param applicationId application Id.
   * @returns application bypassed restriction (wrapped by promise).
   */
  async getApplicationRestrictionBypasses(
    applicationId: number,
  ): Promise<ApplicationRestrictionBypassHistoryAPIOutDTO> {
    return this.getCall<ApplicationRestrictionBypassHistoryAPIOutDTO>(
      this.addClientRoot(
        `application-restriction-bypass/application/${applicationId}`,
      ),
    );
  }
}
