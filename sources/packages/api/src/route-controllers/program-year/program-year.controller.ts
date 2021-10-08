import { Controller, Get, NotFoundException } from "@nestjs/common";
import { ProgramYearService } from "../../services";
import { OptionItem } from "../../types";
import BaseController from "../BaseController";
import { AllowAuthorizedParty } from "../../auth/decorators/authorized-party.decorator";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
@AllowAuthorizedParty(AuthorizedParties.student)
@Controller("program-year")
export class ProgramYearController extends BaseController {
  constructor(private readonly programYearService: ProgramYearService) {
    super();
  }

  @Get("/options-list")
  async getProgramYears(): Promise<OptionItem[]> {
    const programYears = await this.programYearService.getProgramYears();

    if (!programYears) {
      throw new NotFoundException(`Program Years are not found.`);
    }

    return programYears.map((programYear) => ({
      id: programYear.id,
      description: `(${programYear.programYear}) - ${programYear.programYearDesc}`,
    }));
  }
}
