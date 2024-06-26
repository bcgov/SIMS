import { Controller, Get } from "@nestjs/common";
import { ClientTypeBaseRoute } from "../../types";
import BaseController from "../BaseController";
import { AllowAuthorizedParty } from "../../auth/decorators/authorized-party.decorator";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { ApiTags } from "@nestjs/swagger";
import { OptionItemAPIOutDTO } from "../models/common.dto";
import { IsBCPublicInstitution } from "../../auth/decorators";
import { ProgramYearControllerService } from "./program-year.controller.service";

@AllowAuthorizedParty(AuthorizedParties.institution)
@IsBCPublicInstitution()
@Controller("program-year")
@ApiTags(`${ClientTypeBaseRoute.Institution}-program-year`)
export class ProgramYearInstitutionsController extends BaseController {
  constructor(
    private readonly programYearControllerService: ProgramYearControllerService,
  ) {
    super();
  }

  /**
   * Gets a list of program years returned as option items (id/description pair).
   * @returns an array of program years as id/description objects.
   */
  @Get("options-list")
  async getProgramYears(): Promise<OptionItemAPIOutDTO[]> {
    return this.programYearControllerService.getProgramYears();
  }
}
