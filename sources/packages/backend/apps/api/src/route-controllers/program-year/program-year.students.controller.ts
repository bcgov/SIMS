import { Controller, Get } from "@nestjs/common";
import { ClientTypeBaseRoute } from "../../types";
import BaseController from "../BaseController";
import { AllowAuthorizedParty } from "../../auth/decorators/authorized-party.decorator";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { ApiTags } from "@nestjs/swagger";
import { RequiresStudentAccount } from "../../auth/decorators";
import { OptionItemAPIOutDTO } from "../models/common.dto";
import { ProgramYearControllerService } from "./program-year.controller.service";
import { ProgramYearsApiOutDTO } from "./models/program-year.dto";

@AllowAuthorizedParty(AuthorizedParties.student)
@RequiresStudentAccount()
@Controller("program-year")
@ApiTags(`${ClientTypeBaseRoute.Student}-program-year`)
export class ProgramYearStudentsController extends BaseController {
  constructor(
    private readonly programYearControllerService: ProgramYearControllerService,
  ) {
    super();
  }

  /**
   * Gets a list of program years returned as option items.
   * @returns an array of program years as id/description objects.
   */
  @Get("options-list")
  async getProgramYearsOptionsList(): Promise<OptionItemAPIOutDTO[]> {
    return this.programYearControllerService.getProgramYearsOptionsList();
  }

  /**
   * Gets a list of program years.
   * @returns list of program years.
   */
  @Get()
  async getProgramYears(): Promise<ProgramYearsApiOutDTO> {
    return this.programYearControllerService.getProgramYears();
  }
}
