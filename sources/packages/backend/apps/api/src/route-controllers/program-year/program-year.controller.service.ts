import { Injectable, NotFoundException } from "@nestjs/common";
import { ProgramYearService } from "../../services";
import { OptionItemAPIOutDTO } from "../models/common.dto";

@Injectable()
export class ProgramYearControllerService {
  constructor(private readonly programYearService: ProgramYearService) {}

  /**
   * Get all active the program years information.
   * @returns active program years ordered by name in descendent order.
   */
  async getProgramYears(): Promise<OptionItemAPIOutDTO[]> {
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
