import ApiClient from "@/services/http/ApiClient";
import {
  ApplicationRestrictionBypassAPIOutDTO,
  ApplicationRestrictionBypassHistoryAPIOutDTO,
  AvailableStudentRestrictionsAPIOutDTO,
  BypassRestrictionAPIInDTO,
  RemoveBypassRestrictionAPIInDTO,
} from "@/services/http/dto";

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

  /**
   * Gets all available student restriction bypasses for an application.
   * @param applicationId application Id.
   * @returns student restrictions.
   */
  async getAvailableStudentRestrictions(
    applicationId: number,
  ): Promise<AvailableStudentRestrictionsAPIOutDTO> {
    return ApiClient.ApplicationRestrictionBypassApi.getAvailableStudentRestrictions(
      applicationId,
    );
  }

  /**
   * Bypass a student restriction bypass.
   * @param restrictionDetails restriction details.
   */
  async bypassRestriction(
    restrictionDetails: BypassRestrictionAPIInDTO,
  ): Promise<void> {
    await ApiClient.ApplicationRestrictionBypassApi.bypassRestriction(
      restrictionDetails,
    );
  }

  /**
   * Removes an application restriction bypass.
   * @param applicationRestrictionBypassId application restriction bypass id.
   * @param restrictionDetails restriction details.
   */
  async removeBypass(
    applicationRestrictionBypassId: number,
    restrictionDetails: RemoveBypassRestrictionAPIInDTO,
  ): Promise<void> {
    await ApiClient.ApplicationRestrictionBypassApi.removeBypass(
      applicationRestrictionBypassId,
      restrictionDetails,
    );
  }

  /**
   * Gets an application restriction bypass by id.
   * @param applicationRestrictionBypassId application restriction bypass id.
   * @returns application restriction bypass.
   */
  async getApplicationRestrictionBypass(
    applicationRestrictionBypassId: number,
  ): Promise<ApplicationRestrictionBypassAPIOutDTO> {
    return ApiClient.ApplicationRestrictionBypassApi.getApplicationRestrictionBypass(
      applicationRestrictionBypassId,
    );
  }
}
