import ApiClient from "@/services/http/ApiClient";
import { BypassedRestrictionSummaryAPIOutDTO } from "@/services/http/dto";

/**
 * Client service layer for Bypassed Restrictions.
 */
export class BypassedRestrictionService {
  // Shared Instance
  private static instance: BypassedRestrictionService;

  static get shared(): BypassedRestrictionService {
    return this.instance || (this.instance = new this());
  }

  /**
   * Get history of bypassed restrictions for an application that is not a draft.
   * @param applicationId application id.
   * @returns summary of the bypassed restriction history for a student application.
   */
  async getBypassedRestrictionHistory(
    applicationId: number,
  ): Promise<BypassedRestrictionSummaryAPIOutDTO[]> {
    return ApiClient.BypassedRestrictionApi.getBypassedRestrictions(
      applicationId,
    );
  }
}
