import { Injectable } from "@nestjs/common";
import { ProgramYearService } from "../../services";
import { OptionItemAPIOutDTO } from "../models/common.dto";
import { ProgramYearsApiOutDTO } from "./models/program-year.dto";

@Injectable()
export class ProgramYearControllerService {
  constructor(private readonly programYearService: ProgramYearService) {}

  /**
   * Get all active the program years information as option items.
   * @returns active program years ordered by name in descendent order.
   */
  async getProgramYearsOptionsList(): Promise<OptionItemAPIOutDTO[]> {
    const programYears = await this.programYearService.getProgramYears();
    return programYears.map((programYear) => ({
      id: programYear.id,
      description: `(${programYear.programYear}) - ${programYear.programYearDesc}`,
    }));
  }

  /**
   * Get all active the program years information.
   * @returns active program years ordered by name in descendent order.
   */
  async getProgramYears(): Promise<ProgramYearsApiOutDTO> {
    const programsYears = await this.programYearService.getProgramYears();
    return {
      programYears: programsYears.map((programYear) => ({
        id: programYear.id,
        programYear: programYear.programYear,
        description: programYear.programYearDesc,
        offeringIntensity: programYear.offeringIntensity,
      })),
    };
  }
}
