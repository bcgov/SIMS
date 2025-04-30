import { Controller, Get } from "@nestjs/common";
import {
  DynamicFormConfigurationService,
  ProgramYearService,
} from "../../services";
import { ClientTypeBaseRoute } from "../../types";
import BaseController from "../BaseController";
import { AllowAuthorizedParty } from "../../auth/decorators/authorized-party.decorator";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { ApiTags } from "@nestjs/swagger";
import { RequiresStudentAccount } from "../../auth/decorators";
import { OptionItemAPIOutDTO } from "../models/common.dto";
import { ProgramYearControllerService } from "./program-year.controller.service";

@AllowAuthorizedParty(AuthorizedParties.student)
@RequiresStudentAccount()
@Controller("program-year")
@ApiTags(`${ClientTypeBaseRoute.Student}-program-year`)
export class ProgramYearStudentsController extends BaseController {
  constructor(
    private readonly programYearControllerService: ProgramYearControllerService,
    private readonly programYearService: ProgramYearService,
    private readonly dynamicFormConfigurationService: DynamicFormConfigurationService,
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
