import { Injectable } from "@nestjs/common";
import { ProgramYearService } from "../../services";
import { ProgramYearApiOutDTO } from "./models/program-year.dto";

@Injectable()
export class ProgramYearControllerService {
  constructor(private readonly programYearService: ProgramYearService) {}

  /**
   * Get all active the program years information.
   * @returns active program years ordered by name in descendent order.
   */
  async getProgramYears(): Promise<ProgramYearApiOutDTO[]> {
    const programsYears = await this.programYearService.getProgramYears();
    return programsYears.map((programYear) => ({
      id: programYear.id,
      description: `(${programYear.programYear}) - ${programYear.programYearDesc}`,
      offeringIntensity: programYear.offeringIntensity,
    }));
  }
}
