import { Controller, Get } from "@nestjs/common";
import { ClientTypeBaseRoute } from "../../types";
import BaseController from "../BaseController";
import { AllowAuthorizedParty } from "../../auth/decorators/authorized-party.decorator";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { ApiTags } from "@nestjs/swagger";
import { RequiresStudentAccount } from "../../auth/decorators";
import { ProgramYearControllerService } from "./program-year.controller.service";
import { ProgramYearApiOutDTO } from "./models/program-year.dto";

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
   * Gets a list of program years.
   * @returns list of program years.
   */
  @Get()
  async getProgramYears(): Promise<ProgramYearApiOutDTO[]> {
    return this.programYearControllerService.getProgramYears();
  }
}
