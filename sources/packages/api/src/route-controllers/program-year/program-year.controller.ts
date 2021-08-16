import { Controller, Get, NotFoundException } from "@nestjs/common";
import { ProgramYearService } from "../../services";
import { ProgramYearDto } from "./models/program-year.dto";
import BaseController from "../BaseController";
import { AllowAuthorizedParty } from "../../auth/decorators/authorized-party.decorator";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
@AllowAuthorizedParty(AuthorizedParties.student)
@Controller("program-year")
export class ProgramYearController extends BaseController {
  constructor(private readonly programYearService: ProgramYearService) {
    super();
  }

  @Get()
  async getProgramYears(): Promise<ProgramYearDto[]> {
    const programYears = await this.programYearService.getProgramYears();

    if (!programYears) {
      throw new NotFoundException(`Program Years are not found.`);
    }

    return programYears.map((programYear) => ({
      programYear: programYear.programYear,
      programYearDesc: programYear.programYearDesc,
      formName: programYear.formName,
      id: programYear.id,
    }));
  }
}
