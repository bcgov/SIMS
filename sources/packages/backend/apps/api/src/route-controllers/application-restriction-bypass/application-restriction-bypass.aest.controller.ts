import { Controller, Get, Param, ParseIntPipe } from "@nestjs/common";
import BaseController from "../BaseController";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { UserGroups } from "../../auth/user-groups.enum";
import { AllowAuthorizedParty, Groups } from "../../auth/decorators";
import {
  ApplicationRestrictionBypassHistoryAPIOutDTO,
  ApplicationRestrictionBypassSummary,
} from "./models/application-restriction-bypass.dto";
import { ClientTypeBaseRoute } from "../../types";
import { ApiTags } from "@nestjs/swagger";
import { ApplicationRestrictionBypassService } from "../../services";
import { ApplicationRestrictionBypass } from "@sims/sims-db";

/**
 * Controller for AEST Application Restriction Bypasses.
 * This consists of all Rest APIs for AEST application restriction bypasses.
 */
@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("application-restriction-bypass")
@ApiTags(`${ClientTypeBaseRoute.AEST}-application-restriction-bypass`)
export class ApplicationRestrictionBypassAESTController extends BaseController {
  constructor(
    private readonly applicationRestrictionBypassService: ApplicationRestrictionBypassService,
  ) {
    super();
  }

  /**
   * Get application restriction bypasses for a given application.
   * @param applicationId id of the application to retrieve restriction bypasses.
   * @returns application restriction bypasses.
   */
  @Get("application/:applicationId")
  async getApplicationRestrictionBypasses(
    @Param("applicationId", ParseIntPipe) applicationId: number,
  ): Promise<ApplicationRestrictionBypassHistoryAPIOutDTO> {
    let bypasses: ApplicationRestrictionBypassSummary[] = [];
    const applicationRestrictionBypasses =
      await this.applicationRestrictionBypassService.getApplicationRestrictionBypasses(
        applicationId,
      );
    bypasses = applicationRestrictionBypasses.map(
      (item: ApplicationRestrictionBypass) => ({
        id: item.id,
        restrictionCategory:
          item.studentRestriction.restriction.restrictionCategory,
        restrictionCode: item.studentRestriction.restriction.restrictionCode,
        isRestrictionActive: item.studentRestriction.isActive,
        isBypassActive: item.isActive,
      }),
    );

    return { bypasses };
  }
}
