import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import {
  ApplicationRestrictionBypassAPIOutDTO,
  ApplicationRestrictionBypassHistoryAPIOutDTO,
  AvailableStudentRestrictionsAPIOutDTO,
  BypassRestrictionAPIInDTO,
  RemoveBypassRestrictionAPIInDTO,
} from "@/services/http/dto";

/**
 * Http API client for Application Restriction Bypasses.
 */
export class ApplicationRestrictionBypassApi extends HttpBaseClient {
  /**
   * API client to call the application restriction bypasses rest API.
   * @param applicationId application Id.
   * @returns application restriction bypasses (wrapped by promise).
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

  /**
   * Gets all available student restriction bypasses for an application.
   * @param applicationId application Id.
   * @returns application restriction bypasses.
   */
  async getAvailableStudentRestrictions(
    applicationId: number,
  ): Promise<AvailableStudentRestrictionsAPIOutDTO> {
    return this.getCall<AvailableStudentRestrictionsAPIOutDTO>(
      this.addClientRoot(
        `application-restriction-bypass/application/${applicationId}/options-list`,
      ),
    );
  }

  /**
   * Bypass a student restriction bypass.
   * @param restrictionDetails restriction details.
   * @returns application restriction bypasses.
   */
  async bypassRestriction(
    restrictionDetails: BypassRestrictionAPIInDTO,
  ): Promise<void> {
    await this.postCall(
      this.addClientRoot("application-restriction-bypass"),
      restrictionDetails,
    );
  }

  /**
   * Removes an application restriction bypass.
   * @param applicationRestrictionBypassId application restriction bypass id.
   * @param restrictionDetails restriction details.
   * @returns application restriction bypasses.
   */
  async removeBypass(
    applicationRestrictionBypassId: number,
    restrictionDetails: RemoveBypassRestrictionAPIInDTO,
  ): Promise<void> {
    await this.patchCall(
      this.addClientRoot(
        `application-restriction-bypass/${applicationRestrictionBypassId}`,
      ),
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
    return this.getCall<ApplicationRestrictionBypassAPIOutDTO>(
      this.addClientRoot(
        `application-restriction-bypass/${applicationRestrictionBypassId}`,
      ),
    );
  }
}
