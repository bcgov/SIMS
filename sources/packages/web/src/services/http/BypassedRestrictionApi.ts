import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import { BypassedRestrictionSummaryAPIOutDTO } from "@/services/http/dto";

/**
 * Http API client for Bypassed Restrictions.
 */
export class BypassedRestrictionApi extends HttpBaseClient {
  /**
   * API client to call the application bypassed restrictions rest API.
   * @param applicationId application Id.
   * @returns application bypassed restriction (wrapped by promise).
   */
  async getBypassedRestrictions(
    applicationId: number,
  ): Promise<BypassedRestrictionSummaryAPIOutDTO[]> {
    return this.getCall<BypassedRestrictionSummaryAPIOutDTO[]>(
      this.addClientRoot(
        `application-restriction-bypass/application/${applicationId}`,
      ),
    );
  }
}
