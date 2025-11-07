import { Controller, Get } from "@nestjs/common";
import { ClientTypeBaseRoute } from "../../types";
import BaseController from "../BaseController";
import { AllowAuthorizedParty } from "../../auth/decorators/authorized-party.decorator";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { ApiTags } from "@nestjs/swagger";
import { IsBCPublicInstitution } from "../../auth/decorators";
import { ProgramYearControllerService } from "./program-year.controller.service";
import { ProgramYearApiOutDTO } from "../../route-controllers";

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
   * Gets a list of program years.
   * @returns list of program years.
   */
  @Get()
  async getProgramYears(): Promise<ProgramYearApiOutDTO[]> {
    return this.programYearControllerService.getProgramYears();
  }
}
