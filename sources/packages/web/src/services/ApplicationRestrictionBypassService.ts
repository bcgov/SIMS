import ApiClient from "@/services/http/ApiClient";
import { ApplicationRestrictionBypassHistoryAPIOutDTO } from "@/services/http/dto";

/**
 * Client service layer for Application Restriction Bypass.
 */
export class ApplicationRestrictionBypassService {
  // Shared Instance
  private static instance: ApplicationRestrictionBypassService;

  static get shared(): ApplicationRestrictionBypassService {
    return this.instance || (this.instance = new this());
  }

  /**
   * Get history of restriction bypasses for an application that is not a draft.
   * @param applicationId application id.
   * @returns history of the restriction bypasses for a student application.
   */
  async getApplicationRestrictionBypassesHistory(
    applicationId: number,
  ): Promise<ApplicationRestrictionBypassHistoryAPIOutDTO> {
    return ApiClient.ApplicationRestrictionBypassApi.getApplicationRestrictionBypasses(
      applicationId,
    );
  }
}
