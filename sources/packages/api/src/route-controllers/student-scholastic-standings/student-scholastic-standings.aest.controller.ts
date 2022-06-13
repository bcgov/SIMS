import { Controller, Get, Param, ParseIntPipe } from "@nestjs/common";
import { ApiNotFoundResponse, ApiTags } from "@nestjs/swagger";
import { UserGroups } from "../../auth/user-groups.enum";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, Groups } from "../../auth/decorators";
import BaseController from "../BaseController";
import { ClientTypeBaseRoute } from "../../types";
import { ScholasticStandingSubmissionAPIOutDTO } from "./models/student-scholastic-standings.dto";

import { ScholasticStandingControllerService } from "./student-scholastic-standings.controller.service";

/**
 * Scholastic standing controller for AEST Client.
 */
@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("scholastic-standing")
@ApiTags(`${ClientTypeBaseRoute.AEST}-scholastic-standing`)
export class ScholasticStandingAESTController extends BaseController {
  constructor(
    private readonly scholasticStandingControllerService: ScholasticStandingControllerService,
  ) {
    super();
  }

  /**
   * Get Scholastic Standing submission details.
   * @param scholasticStandingId scholastic standing id.
   * @returns Scholastic Standing.
   */

  @Get(":scholasticStandingId")
  @ApiNotFoundResponse({
    description: "Scholastic Standing not found.",
  })
  async getScholasticStanding(
    @Param("scholasticStandingId", ParseIntPipe) scholasticStandingId: number,
  ): Promise<ScholasticStandingSubmissionAPIOutDTO> {
    return this.scholasticStandingControllerService.getScholasticStanding(
      scholasticStandingId,
    );
  }
}
