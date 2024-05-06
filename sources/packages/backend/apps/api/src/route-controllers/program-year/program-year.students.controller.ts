import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
} from "@nestjs/common";
import { ProgramYearService } from "../../services";
import { ClientTypeBaseRoute } from "../../types";
import BaseController from "../BaseController";
import { AllowAuthorizedParty } from "../../auth/decorators/authorized-party.decorator";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { ProgramYearAPIOutDTO } from "./models/program-year.dto";
import { ApiNotFoundResponse, ApiTags } from "@nestjs/swagger";
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
  ) {
    super();
  }

  /**
   * Gets a list of program years returned as option items (id/description pair).
   * @returns an array of program years as id/description objects.
   */
  @Get("options-list")
  @ApiNotFoundResponse({
    description: "No program years were found.",
  })
  async getProgramYears(): Promise<OptionItemAPIOutDTO[]> {
    return this.programYearControllerService.getProgramYears();
  }

  /**
   * Gets an active program year given an id.
   * @param id program year id.
   * @returns an active program year with the id provided.
   */
  @Get(":id/active")
  @ApiNotFoundResponse({
    description:
      "Not able to find an active program year with the provided id.",
  })
  async getActiveProgramYearById(
    @Param("id", ParseIntPipe) id: number,
  ): Promise<ProgramYearAPIOutDTO> {
    const programYear = await this.programYearService.getActiveProgramYear(id);
    if (!programYear) {
      throw new NotFoundException(`Program Year Id ${id} was not found.`);
    }
    return {
      id: programYear.id,
      programYear: programYear.programYear,
      programYearDesc: programYear.programYearDesc,
      formName: programYear.formName,
    };
  }
}
