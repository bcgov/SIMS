import { Controller, Get, NotFoundException } from "@nestjs/common";
import { ProgramYearService } from "../../services";
import { ProgramYearDto } from "./models/program-year.dto";
import BaseController from "../BaseController";
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
    }));
  }
}
